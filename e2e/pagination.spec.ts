import { readFile } from "node:fs/promises";
import { expect, signInAs, test } from "./fixtures/playwright";
import {
  paginationOwner,
  paginationSupporterEmail,
  paginationProjectId,
  paginationProjectPrefix,
} from "./fixtures/pagination-data";
import { e2eTestUsers } from "./fixtures/test-users";

for (const width of [320, 390, 1280]) {
  test(`reaches a co-managed project beyond the old 200 limit at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await signInAs(page, paginationOwner);
    await page.goto("/dashboard?tab=my-seeds&page=11");
    await expect(page.getByText("Page 11 of 11")).toBeVisible();
    await expect(
      page.getByText(`${paginationProjectPrefix} 000`),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Next", exact: true }),
    ).toBeDisabled();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        ),
      )
      .toBeLessThanOrEqual(0);
    await page.screenshot({
      path: testInfo.outputPath(`dashboard-${width}.png`),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Previous", exact: true }).click();
    await expect(page).toHaveURL(/tab=my-seeds&page=10/);
    await expect(page.getByText("Page 10 of 11")).toBeVisible();
    await page.goto("/dashboard?tab=my-seeds&page=999");
    await expect(page).toHaveURL(/tab=my-seeds&page=11/);
  });
}

test("shows true supporter totals, paginates, and exports all 501 supporters", async ({
  page,
}) => {
  await signInAs(page, paginationOwner);
  await page.goto(`/dashboard/projects/${paginationProjectId}/supporters`);
  await expect(
    page.getByText("501 people supporting this project."),
  ).toBeVisible();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(51);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export CSV" }).click();
  const download = await downloadPromise;
  const csv = await readFile((await download.path())!, "utf8");
  expect(csv.trim().split("\n")).toHaveLength(502);
  for (let index = 0; index < 501; index++)
    expect(csv).toContain(paginationSupporterEmail(index));
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Page 2 of 11")).toBeVisible();
  await page.goto(
    `/dashboard/projects/${paginationProjectId}/supporters?page=999`,
  );
  await expect(page).toHaveURL(/page=11/);
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(2);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        ),
      )
      .toBeLessThanOrEqual(0);
    await expect(page.getByRole("link", { name: "Export CSV" })).toBeVisible();
  }
});

test("rejects supporter exports for ordinary users and Council", async ({
  page,
}) => {
  for (const user of [e2eTestUsers.member, e2eTestUsers.council]) {
    await signInAs(page, user);
    const response = await page.request.get(
      `/api/projects/${paginationProjectId}/supporters/export`,
    );
    expect(response.status()).toBe(403);
  }
});

test("clamps all paginated admin tabs and preserves project filters", async ({
  page,
}) => {
  await signInAs(page, e2eTestUsers.admin);
  await page.goto(
    `/admin?tab=seeds&search=${encodeURIComponent(paginationProjectPrefix)}&stage=seed&page=999`,
  );
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get("page") === "9" &&
      url.searchParams.get("stage") === "seed" &&
      url.searchParams.get("search") === paginationProjectPrefix,
  );
  await expect(
    page.getByRole("tabpanel").getByText("Page 9 of 9"),
  ).toBeVisible();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(2);
  await page.goto("/admin?tab=insights&page=999");
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get("tab") === "insights" &&
      url.searchParams.get("page") !== "999",
  );
  await expect(page.getByText("No comments yet.")).toHaveCount(0);
  await page.goto("/admin?tab=users&page=999&search=e2e-casey-member");
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get("tab") === "users" &&
      !url.searchParams.has("page") &&
      url.searchParams.get("search") === "e2e-casey-member",
  );
  await expect(
    page.getByRole("table").getByText(e2eTestUsers.member.email),
  ).toBeVisible();
});
