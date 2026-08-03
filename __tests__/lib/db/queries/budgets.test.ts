import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    and: vi.fn(actual.and),
    eq: vi.fn(actual.eq),
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      projectBudgets: { findMany: vi.fn() },
    },
  },
}));

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectBudgets } from "@/lib/db/schema";
import { getBudgets, getPublicBudgets } from "@/lib/db/queries/budgets";

function budgetRow(overrides?: Record<string, unknown>) {
  return {
    id: "budget-1",
    projectId: "seed-1",
    status: "proposed",
    lineItems: [{ label: "Soil", amount: 100 }],
    notes: null,
    isPublic: false,
    updatedBy: "user-1",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

describe("getBudgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries by project id", async () => {
    vi.mocked(db.query.projectBudgets.findMany).mockResolvedValue([]);

    await getBudgets("seed-1");

    expect(eq).toHaveBeenCalledWith(projectBudgets.projectId, "seed-1");
    const call = vi.mocked(db.query.projectBudgets.findMany).mock.calls[0][0];
    expect(call).toEqual({ where: expect.anything() });
  });

  it("splits rows into proposed and final by status", async () => {
    const proposed = budgetRow({ id: "budget-proposed", status: "proposed" });
    const final = budgetRow({ id: "budget-final", status: "final" });
    vi.mocked(db.query.projectBudgets.findMany).mockResolvedValue([
      proposed,
      final,
    ] as never);

    const result = await getBudgets("seed-1");

    expect(result).toEqual({ proposed, final });
  });

  it("returns null for a status with no matching row", async () => {
    const proposed = budgetRow({ id: "budget-proposed", status: "proposed" });
    vi.mocked(db.query.projectBudgets.findMany).mockResolvedValue([
      proposed,
    ] as never);

    const result = await getBudgets("seed-1");

    expect(result).toEqual({ proposed, final: null });
  });

  it("returns null for both when there are no budget rows", async () => {
    vi.mocked(db.query.projectBudgets.findMany).mockResolvedValue([]);

    const result = await getBudgets("seed-1");

    expect(result).toEqual({ proposed: null, final: null });
  });
});

describe("getPublicBudgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters by project id and public visibility", async () => {
    vi.mocked(db.query.projectBudgets.findMany).mockResolvedValue([]);

    await getPublicBudgets("seed-1");

    expect(eq).toHaveBeenCalledWith(projectBudgets.projectId, "seed-1");
    expect(eq).toHaveBeenCalledWith(projectBudgets.isPublic, true);
    expect(and).toHaveBeenCalled();
  });

  it("returns the rows resolved by the database", async () => {
    const rows = [budgetRow({ isPublic: true, status: "final" })];
    vi.mocked(db.query.projectBudgets.findMany).mockResolvedValue(
      rows as never,
    );

    const result = await getPublicBudgets("seed-1");

    expect(result).toBe(rows);
  });

  it("returns an empty array when there are no public budgets", async () => {
    vi.mocked(db.query.projectBudgets.findMany).mockResolvedValue([]);

    const result = await getPublicBudgets("seed-1");

    expect(result).toEqual([]);
  });
});
