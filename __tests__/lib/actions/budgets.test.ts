import { describe, expect, it, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import {
  mockSession,
  mockAdminSession,
  mockDbInsertOnConflictChain,
  setAuthMock,
} from "../../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      seeds: { findFirst: vi.fn() },
    },
    insert: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { saveBudget } from "@/lib/actions/budgets";

function mockSeedRow(overrides?: Record<string, unknown>) {
  return {
    id: "seed-1",
    createdBy: "user-1",
    status: "in_progress",
    ...overrides,
  };
}

describe("saveBudget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);
    const result = await saveBudget("seed-1", "proposed", { lineItems: [] });
    expect(result).toEqual({ error: "You must be signed in." });
  });

  it("rejects an invalid budget stage", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    const result = await saveBudget("seed-1", "draft", { lineItems: [] });
    expect(result).toEqual({ error: "Invalid budget stage." });
  });

  it("returns error when seed not found", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(undefined);

    const result = await saveBudget("nonexistent", "proposed", {
      lineItems: [],
    });
    expect(result).toEqual({ error: "Seed not found." });
  });

  it("rejects a non-owner non-admin", async () => {
    setAuthMock(auth, mockSession({ id: "other-user" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(mockSeedRow() as any);

    const result = await saveBudget("seed-1", "proposed", { lineItems: [] });
    expect(result).toEqual({
      error: "You do not have permission to edit this Sprout's budget.",
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("rejects a seed that is not a Sprout", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSeedRow({ status: "approved" }) as any,
    );

    const result = await saveBudget("seed-1", "proposed", { lineItems: [] });

    expect(result).toEqual({
      error: "Budgets are only available for Sprouts.",
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("validates line item data", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(mockSeedRow() as any);

    const result = await saveBudget("seed-1", "proposed", {
      lineItems: [{ label: "", amount: 100 }],
    });
    expect(result).toHaveProperty("error");
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("saves a budget as the Gardener", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(mockSeedRow() as any);
    const chain = mockDbInsertOnConflictChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);

    const result = await saveBudget("seed-1", "proposed", {
      lineItems: [{ label: "Boat expense", amount: 1500 }],
      notes: "Not sure if we're getting $5,000 or $6,000.",
    });

    expect(result).toEqual({ success: true });
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        seedId: "seed-1",
        status: "proposed",
        lineItems: [{ label: "Boat expense", amount: 1500 }],
        notes: "Not sure if we're getting $5,000 or $6,000.",
        updatedBy: "user-1",
      }),
    );
    expect(chain._onConflictDoUpdate).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1/team");
  });

  it("allows an admin to save a budget on any Sprout", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSeedRow({ createdBy: "someone-else" }) as any,
    );
    const chain = mockDbInsertOnConflictChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);

    const result = await saveBudget("seed-1", "final", { lineItems: [] });
    expect(result).toEqual({ success: true });
  });
});
