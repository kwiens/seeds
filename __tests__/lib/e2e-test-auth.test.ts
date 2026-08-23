import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getE2ETestAuthSecret,
  matchesE2ETestAuthSecret,
} from "@/lib/e2e-test-auth";

const developmentDatabaseUrl =
  "postgresql://user:password@ep-e2e-development.us-east-2.aws.neon.tech/neondb?sslmode=require";
const productionDatabaseUrl =
  "postgresql://user:password@ep-divine-tooth-aidea37t.us-east-2.aws.neon.tech/neondb?sslmode=require";
const testSecret = "a-secure-e2e-secret-with-32-characters";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getE2ETestAuthSecret", () => {
  it("keeps the provider disabled unless explicitly requested", () => {
    vi.stubEnv("E2E_TEST_AUTH_ENABLED", "false");

    expect(getE2ETestAuthSecret()).toBeNull();
  });

  it("allows a safe Development database with a strong secret", () => {
    setTestEnvironment({ nodeEnvironment: "development" });

    expect(getE2ETestAuthSecret()).toBe(testSecret);
  });

  it("allows an explicitly configured Preview environment", () => {
    setTestEnvironment({
      nodeEnvironment: "production",
      vercelEnvironment: "preview",
    });

    expect(getE2ETestAuthSecret()).toBe(testSecret);
  });

  it("rejects Production environments", () => {
    setTestEnvironment({
      nodeEnvironment: "production",
      vercelEnvironment: "production",
    });

    expect(() => getE2ETestAuthSecret()).toThrow(
      "only available in local Development or Preview",
    );
  });

  it("rejects the Production database even with the break-glass override", () => {
    setTestEnvironment({ nodeEnvironment: "development" });
    vi.stubEnv("DATABASE_URL", productionDatabaseUrl);
    vi.stubEnv("ALLOW_PRODUCTION_DATABASE", "true");

    expect(() => getE2ETestAuthSecret()).toThrow(
      "must never use the Production database",
    );
  });

  it("rejects a missing or short secret", () => {
    setTestEnvironment({ nodeEnvironment: "development" });
    vi.stubEnv("E2E_TEST_AUTH_SECRET", "too-short");

    expect(() => getE2ETestAuthSecret()).toThrow(
      "must contain at least 32 characters",
    );
  });
});

describe("matchesE2ETestAuthSecret", () => {
  it("uses an exact comparison", () => {
    expect(matchesE2ETestAuthSecret(testSecret, testSecret)).toBe(true);
    expect(matchesE2ETestAuthSecret(`${testSecret}!`, testSecret)).toBe(false);
    expect(
      matchesE2ETestAuthSecret("x".repeat(testSecret.length), testSecret),
    ).toBe(false);
  });
});

function setTestEnvironment({
  nodeEnvironment,
  vercelEnvironment,
}: {
  nodeEnvironment: "development" | "production";
  vercelEnvironment?: "development" | "preview" | "production";
}) {
  vi.stubEnv("E2E_TEST_AUTH_ENABLED", "true");
  vi.stubEnv("E2E_TEST_AUTH_SECRET", testSecret);
  vi.stubEnv("DATABASE_URL", developmentDatabaseUrl);
  vi.stubEnv("NODE_ENV", nodeEnvironment);
  vi.stubEnv("VERCEL_ENV", vercelEnvironment);
}
