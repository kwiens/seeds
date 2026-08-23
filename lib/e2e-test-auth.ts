import { timingSafeEqual } from "node:crypto";
import { assertSafeDatabaseUrl, isProductionDatabase } from "@/lib/db/safety";

export const E2E_TEST_AUTH_PROVIDER_ID = "e2e-test";

const MINIMUM_SECRET_LENGTH = 32;

export function getE2ETestAuthSecret(): string | null {
  if (process.env.E2E_TEST_AUTH_ENABLED !== "true") return null;

  const vercelEnvironment = process.env.VERCEL_ENV;
  const isPreview = vercelEnvironment === "preview";
  const isLocalDevelopment = process.env.NODE_ENV !== "production";

  if (
    vercelEnvironment === "production" ||
    (!isPreview && !isLocalDevelopment)
  ) {
    throw new Error(
      "E2E test authentication is only available in local Development or Preview.",
    );
  }

  const databaseUrl = assertSafeDatabaseUrl(process.env.DATABASE_URL);
  if (isProductionDatabase(databaseUrl)) {
    throw new Error(
      "E2E test authentication must never use the Production database.",
    );
  }

  const secret = process.env.E2E_TEST_AUTH_SECRET;
  if (!secret || secret.length < MINIMUM_SECRET_LENGTH) {
    throw new Error(
      `E2E_TEST_AUTH_SECRET must contain at least ${MINIMUM_SECRET_LENGTH} characters.`,
    );
  }

  return secret;
}

export function matchesE2ETestAuthSecret(
  provided: string,
  expected: string,
): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}
