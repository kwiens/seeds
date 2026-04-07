import { describe, expect, it, vi, beforeEach } from "vitest";
import { mockSession, mockAdminSession, setAuthMock } from "../../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    selectDistinctOn: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  exportContributorsCsv,
  exportSeedsCsv,
  exportSupportersCsv,
} from "@/lib/actions/export";

// Helper to build a fluent select chain that resolves to `rows`
function mockSelectChain(rows: unknown[]) {
  const chain: Record<string, any> = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.innerJoin = vi.fn().mockReturnValue(chain);
  chain.leftJoin = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockResolvedValue(rows);
  return chain;
}

describe("exportSeedsCsv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    setAuthMock(auth, null);
    await expect(exportSeedsCsv()).rejects.toThrow("Unauthorized");
  });

  it("rejects non-admin users", async () => {
    setAuthMock(auth, mockSession({ role: "user" }));
    await expect(exportSeedsCsv()).rejects.toThrow("Unauthorized");
  });

  it("returns CSV with header and data rows", async () => {
    setAuthMock(auth, mockAdminSession());

    const mockRows = [
      {
        id: "seed-1",
        name: "Test Seed",
        summary: "A test summary",
        category: "daily_access",
        status: "approved",
        gardeners: ["Alice", "Bob"],
        locationAddress: "123 Main St",
        locationDescription: "Near the park",
        roots: [
          { name: "Org A", committed: true },
          { name: "Org B", committed: false },
        ],
        supportPeople: ["Charlie"],
        waterHave: ["Tools"],
        waterNeed: ["Funding"],
        budget: "$500",
        obstacles: null,
        createdAt: new Date("2024-06-01T00:00:00Z"),
        creatorName: "Test User",
        creatorEmail: "test@example.com",
        supportCount: 3,
      },
    ];

    // exportSeedsCsv builds a subquery with db.select().from().groupBy().as()
    const subqueryChain: Record<string, any> = {};
    subqueryChain.from = vi.fn().mockReturnValue(subqueryChain);
    subqueryChain.groupBy = vi.fn().mockReturnValue(subqueryChain);
    subqueryChain.as = vi.fn().mockReturnValue("support_counts_subquery");

    const mainChain = mockSelectChain(mockRows);

    vi.mocked(db.select)
      .mockReturnValueOnce(subqueryChain as any) // subquery
      .mockReturnValueOnce(mainChain as any); // main query

    const csv = await exportSeedsCsv();
    const lines = csv.split("\n");

    expect(lines[0]).toBe(
      "ID,Name,Category,Status,Summary,Gardeners,Location,Location Description,Roots,Guides,Fertilizer (Have),Water (Need),Budget,Obstacles,URL,Created At,Supporters,Creator Name,Creator Email",
    );

    expect(lines[1]).toContain("seed-1");
    expect(lines[1]).toContain("Test Seed");
    expect(lines[1]).toContain("Everyday Access"); // human-readable label
    expect(lines[1]).toContain("Alice; Bob");
    expect(lines[1]).toContain("Org A (committed); Org B");
    expect(lines[1]).toContain("https://www.npcseeds.org/seeds/seed-1");
    expect(lines[1]).toContain("3");
  });

  it("handles null/empty JSONB fields gracefully", async () => {
    setAuthMock(auth, mockAdminSession());

    const mockRows = [
      {
        id: "seed-2",
        name: "Minimal Seed",
        summary: "Bare minimum",
        category: "respect",
        status: "pending",
        gardeners: null,
        locationAddress: null,
        locationDescription: null,
        roots: null,
        supportPeople: [],
        waterHave: null,
        waterNeed: [],
        budget: null,
        obstacles: null,
        createdAt: new Date("2024-06-01T00:00:00Z"),
        creatorName: "User",
        creatorEmail: "user@example.com",
        supportCount: 0,
      },
    ];

    const subqueryChain: Record<string, any> = {};
    subqueryChain.from = vi.fn().mockReturnValue(subqueryChain);
    subqueryChain.groupBy = vi.fn().mockReturnValue(subqueryChain);
    subqueryChain.as = vi.fn().mockReturnValue("support_counts_subquery");

    const mainChain = mockSelectChain(mockRows);

    vi.mocked(db.select)
      .mockReturnValueOnce(subqueryChain as any)
      .mockReturnValueOnce(mainChain as any);

    // Should not throw
    const csv = await exportSeedsCsv();
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2); // header + 1 row
  });
});

describe("exportContributorsCsv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-admin users", async () => {
    setAuthMock(auth, mockSession({ role: "user" }));
    await expect(exportContributorsCsv()).rejects.toThrow("Unauthorized");
  });
});

describe("exportSupportersCsv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-admin users", async () => {
    setAuthMock(auth, mockSession({ role: "user" }));
    await expect(exportSupportersCsv()).rejects.toThrow("Unauthorized");
  });
});
