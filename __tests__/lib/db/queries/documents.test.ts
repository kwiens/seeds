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
    select: vi.fn(),
  },
}));

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectUpdates, users } from "@/lib/db/schema";
import { getProjectDocuments } from "@/lib/db/queries/documents";

// Mirrors the fluent select chain helper used in export.test.ts.
function mockSelectChain(rows: unknown[]) {
  const chain: Record<string, any> = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.innerJoin = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockResolvedValue(rows);
  return chain;
}

describe("getProjectDocuments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("selects the team-visibility updates for the project, joined to their poster", async () => {
    const chain = mockSelectChain([]);
    vi.mocked(db.select).mockReturnValue(chain as any);

    await getProjectDocuments("seed-1");

    expect(db.select).toHaveBeenCalledWith(
      expect.objectContaining({
        id: projectUpdates.id,
        attachments: projectUpdates.attachments,
        createdAt: projectUpdates.createdAt,
        posterName: users.name,
      }),
    );
    expect(chain.from).toHaveBeenCalledWith(projectUpdates);
    expect(chain.innerJoin).toHaveBeenCalledWith(users, expect.anything());
    expect(eq).toHaveBeenCalledWith(projectUpdates.createdBy, users.id);
    expect(eq).toHaveBeenCalledWith(projectUpdates.projectId, "seed-1");
    expect(eq).toHaveBeenCalledWith(projectUpdates.visibility, "team");
    expect(and).toHaveBeenCalled();
  });

  it("flattens each update's attachments into one document per file, with a per-update index", async () => {
    const rows = [
      {
        id: "update-1",
        createdAt: new Date("2024-01-01"),
        posterName: "Alice",
        attachments: [
          { name: "plan.pdf", url: "https://x/plan.pdf", size: 100 },
          { name: "budget.xlsx", url: "https://x/budget.xlsx", size: 200 },
        ],
      },
    ];
    const chain = mockSelectChain(rows);
    vi.mocked(db.select).mockReturnValue(chain as any);

    const result = await getProjectDocuments("seed-1");

    expect(result).toEqual([
      {
        name: "plan.pdf",
        url: "https://x/plan.pdf",
        size: 100,
        updateId: "update-1",
        attachmentIndex: 0,
        posterName: "Alice",
        createdAt: new Date("2024-01-01"),
      },
      {
        name: "budget.xlsx",
        url: "https://x/budget.xlsx",
        size: 200,
        updateId: "update-1",
        attachmentIndex: 1,
        posterName: "Alice",
        createdAt: new Date("2024-01-01"),
      },
    ]);
  });

  it("sorts documents from newest to oldest update, across multiple updates", async () => {
    const rows = [
      {
        id: "update-old",
        createdAt: new Date("2024-01-01"),
        posterName: "Alice",
        attachments: [{ name: "old.pdf", url: "https://x/old.pdf", size: 1 }],
      },
      {
        id: "update-new",
        createdAt: new Date("2024-06-01"),
        posterName: "Bob",
        attachments: [{ name: "new.pdf", url: "https://x/new.pdf", size: 2 }],
      },
    ];
    const chain = mockSelectChain(rows);
    vi.mocked(db.select).mockReturnValue(chain as any);

    const result = await getProjectDocuments("seed-1");

    expect(result.map((doc) => doc.name)).toEqual(["new.pdf", "old.pdf"]);
  });

  it("contributes nothing for an update with no attachments", async () => {
    const rows = [
      {
        id: "update-1",
        createdAt: new Date("2024-01-01"),
        posterName: "Alice",
        attachments: [],
      },
    ];
    const chain = mockSelectChain(rows);
    vi.mocked(db.select).mockReturnValue(chain as any);

    const result = await getProjectDocuments("seed-1");

    expect(result).toEqual([]);
  });

  it("returns an empty array when there are no matching updates", async () => {
    const chain = mockSelectChain([]);
    vi.mocked(db.select).mockReturnValue(chain as any);

    const result = await getProjectDocuments("seed-1");

    expect(result).toEqual([]);
  });
});
