import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { productionDatabase } from "@/config/deployment";

describe("populate production guard", () => {
  it.each([
    "production",
    "development",
  ])("refuses Production before any writes in %s", (environment) => {
    expect(() =>
      execFileSync(
        process.execPath,
        ["--import", "tsx", "scripts/populate.ts"],
        {
          env: {
            ...process.env,
            VERCEL_ENV: environment,
            ALLOW_PRODUCTION_DATABASE: "true",
            DATABASE_URL: `postgresql://test:test@${productionDatabase.endpoint}.us-east-2.aws.neon.tech/${productionDatabase.database}?sslmode=require`,
          },
          stdio: "pipe",
          timeout: 10_000,
        },
      ),
    ).toThrow(
      environment === "production"
        ? /Development sample data must never run in Production/
        : /Refusing to use the Production database/,
    );
  });
});
