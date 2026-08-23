import { expect, signInAs, test } from "./fixtures/playwright";
import { e2eTestUsers } from "./fixtures/test-users";

test.describe("Admin directory access", () => {
  test("redirects anonymous visitors to sign in", async ({ page }) => {
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/api\/auth\/signin/);
  });

  for (const [label, user] of [
    ["regular users", e2eTestUsers.member],
    ["Council members", e2eTestUsers.council],
  ] as const) {
    test(`prevents ${label} from opening Admin`, async ({ page }) => {
      await signInAs(page, user);
      await page.goto("/admin");

      await expect(page).toHaveURL("/");
      await expect(
        page.getByRole("heading", { name: "Admin", exact: true }),
      ).toHaveCount(0);
    });
  }

  test("lets admins open People and renders account details", async ({
    page,
  }) => {
    await openPeopleDirectory(page);

    await expect(
      page.getByRole("heading", { name: "All People" }),
    ).toBeVisible();

    const adminRow = page.getByRole("row", {
      name: new RegExp(e2eTestUsers.admin.name),
    });
    await expect(adminRow).toContainText(e2eTestUsers.admin.email);
    await expect(adminRow).toContainText("Admin");
    await expect(adminRow).toContainText("Aug 17, 2026");

    const councilRow = page.getByRole("row", {
      name: new RegExp(e2eTestUsers.council.name),
    });
    await expect(councilRow).toContainText("Council");
    await expect(councilRow).toContainText("Aug 19, 2026");

    const memberRow = page.getByRole("row", {
      name: new RegExp(e2eTestUsers.member.name),
    });
    await expect(memberRow).toContainText("Member");
    await expect(memberRow).toContainText("Aug 20, 2026");
  });
});

test.describe("Admin directory search", () => {
  test.beforeEach(async ({ page }) => {
    await openPeopleDirectory(page);
  });

  test("matches names and emails case-insensitively", async ({ page }) => {
    const search = page.getByRole("textbox", {
      name: "Search people by name or email",
    });

    await search.fill("  e2e BOB council  ");
    await expect(page.getByText(e2eTestUsers.council.name)).toBeVisible();
    await expect(page.getByText(e2eTestUsers.admin.name)).toHaveCount(0);

    await search.fill(e2eTestUsers.member.email.toUpperCase());
    await expect(page.getByText(e2eTestUsers.member.name)).toBeVisible();
    await expect(page.getByText(e2eTestUsers.council.name)).toHaveCount(0);
  });

  test("shows the no-match state and restores rows when cleared", async ({
    page,
  }) => {
    const search = page.getByRole("textbox", {
      name: "Search people by name or email",
    });

    await search.fill("e2e-no-such-account@npcseeds.test");
    await expect(page.getByText("No matches.")).toBeVisible();
    await expect(page.getByText(/^0 of \d+$/)).toBeVisible();

    await search.clear();
    await expect(page.getByText("No matches.")).toHaveCount(0);
    await expect(page.getByText(e2eTestUsers.admin.name)).toBeVisible();
    await expect(page.getByText(e2eTestUsers.council.name)).toBeVisible();
    await expect(page.getByText(e2eTestUsers.member.name)).toBeVisible();
  });
});

for (const width of [320, 390]) {
  test(`keeps every Admin tab reachable without page overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await signInAs(page, e2eTestUsers.admin);
    await page.goto("/admin");

    for (const tabName of [
      "Seeds",
      "Comments",
      "Export",
      "People",
      "Settings",
    ]) {
      const tab = page.getByRole("tab", { name: tabName, exact: true });
      await tab.scrollIntoViewIfNeeded();
      await expect(tab).toBeVisible();
      await tab.click();
      await expect(tab).toHaveAttribute("data-state", "active");
      await expectNoPageOverflow(page);
    }
  });
}

async function openPeopleDirectory(page: Parameters<typeof signInAs>[0]) {
  await signInAs(page, e2eTestUsers.admin);
  await page.goto("/admin");
  await page.getByRole("tab", { name: "People", exact: true }).click();
}

async function expectNoPageOverflow(page: Parameters<typeof signInAs>[0]) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(0);
}
