import { test as base, expect, type Page } from "@playwright/test";
import { E2E_TEST_AUTH_PROVIDER_ID } from "@/lib/e2e-test-auth";
import type { E2ETestUser } from "./test-users";

type AutomaticFixtures = {
  applicationErrorMonitor: void;
};

export const test = base.extend<AutomaticFixtures>({
  applicationErrorMonitor: [
    async ({ page, baseURL }, use, testInfo) => {
      const issues: string[] = [];
      const applicationOrigin = baseURL ? new URL(baseURL).origin : null;

      page.on("console", (message) => {
        if (message.type() === "error") {
          issues.push(`console error: ${message.text()}`);
        }
      });
      page.on("pageerror", (error) => {
        issues.push(`uncaught page error: ${error.message}`);
      });
      page.on("requestfailed", (request) => {
        if (
          isApplicationUrl(request.url(), applicationOrigin) &&
          !request.failure()?.errorText.includes("ERR_ABORTED")
        ) {
          issues.push(
            `failed request: ${request.method()} ${request.url()} (${request.failure()?.errorText ?? "unknown error"})`,
          );
        }
      });
      page.on("response", (response) => {
        if (
          response.status() >= 400 &&
          isApplicationUrl(response.url(), applicationOrigin)
        ) {
          issues.push(
            `HTTP ${response.status()}: ${response.request().method()} ${response.url()}`,
          );
        }
      });

      await use();

      if (issues.length > 0) {
        await testInfo.attach("application-errors", {
          body: issues.join("\n"),
          contentType: "text/plain",
        });
      }
      expect(issues, "unexpected browser or application errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export async function signInAs(page: Page, user: E2ETestUser) {
  const secret = process.env.E2E_TEST_AUTH_SECRET;
  expect(
    secret,
    "Playwright did not configure E2E_TEST_AUTH_SECRET",
  ).toBeTruthy();

  const csrfResponse = await page.request.get("/api/auth/csrf");
  expect(csrfResponse.ok()).toBe(true);
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  const signInResponse = await page.request.post(
    `/api/auth/callback/${E2E_TEST_AUTH_PROVIDER_ID}`,
    {
      form: {
        callbackUrl: "/",
        csrfToken,
        email: user.email,
        secret: secret!,
      },
      headers: { "X-Auth-Return-Redirect": "1" },
    },
  );
  expect(signInResponse.ok()).toBe(true);

  const { url } = (await signInResponse.json()) as { url: string };
  expect(new URL(url).searchParams.get("error")).toBeNull();

  const sessionResponse = await page.request.get("/api/auth/session");
  expect(sessionResponse.ok()).toBe(true);
  const session = (await sessionResponse.json()) as {
    user?: { email?: string; role?: string };
  };
  expect(session.user).toMatchObject({
    email: user.email,
    role: user.role,
  });
}

function isApplicationUrl(url: string, applicationOrigin: string | null) {
  if (!applicationOrigin) return false;

  try {
    return new URL(url).origin === applicationOrigin;
  } catch {
    return false;
  }
}
