import { describe, expect, it } from "vitest";
import {
  assertSafeBlobStores,
  assertSafeDatabaseUrl,
  getBlobStoreId,
  getDatabaseIdentity,
  isProductionDatabase,
} from "@/lib/db/safety";

const production =
  "postgresql://user:secret@ep-divine-tooth-aidea37t-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";
const development =
  "postgresql://user:secret@ep-safe-development-123.us-east-1.aws.neon.tech/neondb?sslmode=require";
const blobToken = (store: string) => `vercel_blob_rw_${store}_secret`;

describe("database safety", () => {
  it("normalizes pooled Neon endpoints without exposing credentials", () => {
    expect(getDatabaseIdentity(production)).toEqual({
      endpoint: "ep-divine-tooth-aidea37t",
      database: "neondb",
    });
  });

  it("recognizes only the exact Production endpoint and database", () => {
    expect(isProductionDatabase(production)).toBe(true);
    expect(
      isProductionDatabase(production.replace("/neondb", "/development")),
    ).toBe(false);
    expect(isProductionDatabase(development)).toBe(false);
  });

  it("blocks Production from local and Preview environments", () => {
    expect(() =>
      assertSafeDatabaseUrl(production, { environment: "local" }),
    ).toThrow("Refusing to use the Production database");
    expect(() =>
      assertSafeDatabaseUrl(production, { environment: "preview" }),
    ).toThrow("Refusing to use the Production database");
  });

  it("blocks a Production deployment pointed at non-production", () => {
    expect(() =>
      assertSafeDatabaseUrl(development, { environment: "production" }),
    ).toThrow("non-production database");
  });

  it("allows the matching target for each environment", () => {
    expect(
      assertSafeDatabaseUrl(production, { environment: "production" }),
    ).toBe(production);
    expect(
      assertSafeDatabaseUrl(development, { environment: "development" }),
    ).toBe(development);
  });

  it("requires an explicit break-glass override for local Production access", () => {
    expect(
      assertSafeDatabaseUrl(production, {
        environment: "local",
        allowProduction: true,
      }),
    ).toBe(production);
  });
});

describe("Blob store safety", () => {
  it("extracts only the non-secret store identifier", () => {
    expect(getBlobStoreId(blobToken("store-id"), "TOKEN")).toBe("store-id");
  });

  it("allows the dedicated Development stores locally", () => {
    expect(
      assertSafeBlobStores(
        {
          publicToken: blobToken("cVJ0H9jPR61qF32Y"),
          teamToken: blobToken("YnFQQ1z8IihRdO43"),
        },
        { environment: "local" },
      ),
    ).toMatchObject({ environment: "development" });
  });

  it("rejects Production storage credentials outside Production", () => {
    expect(() =>
      assertSafeBlobStores(
        {
          publicToken: blobToken("0jJDVIhXX8wVN6Ty"),
          teamToken: blobToken("38MP9o7PJgK1kMRX"),
        },
        { environment: "preview" },
      ),
    ).toThrow("do not belong to the preview environment");
  });

  it("rejects a mixed pair of stores", () => {
    expect(() =>
      assertSafeBlobStores(
        {
          publicToken: blobToken("cVJ0H9jPR61qF32Y"),
          teamToken: blobToken("38MP9o7PJgK1kMRX"),
        },
        { environment: "development" },
      ),
    ).toThrow("do not belong to the development environment");
  });
});
