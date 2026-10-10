import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: { select: vi.fn() },
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: vi.fn(actual.eq),
    isNull: vi.fn(actual.isNull),
    and: vi.fn(actual.and),
  };
});

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  getCommentsPage,
  getCommentsByProject,
} from "@/lib/db/queries/comments";
import { projectComments } from "@/lib/db/schema";

// Fluent select-chain mock matching db.select().from().innerJoin().where().orderBy()
function mockSelectChain(rows: unknown[]) {
  const chain: Record<string, any> = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.innerJoin = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockResolvedValue(rows);
  return chain;
}

describe("getCommentsByProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("groups replies under their top-level comment and sorts them chronologically", async () => {
    const rows = [
      {
        id: "c1",
        content: "Top comment 1",
        parentId: null,
        createdAt: new Date("2024-06-03T00:00:00Z"),
        userId: "u1",
        userName: "Alice",
        userImage: null,
      },
      {
        id: "r2",
        content: "Second reply",
        parentId: "c1",
        createdAt: new Date("2024-06-02T00:00:00Z"),
        userId: "u2",
        userName: "Bob",
        userImage: null,
      },
      {
        id: "r1",
        content: "First reply",
        parentId: "c1",
        createdAt: new Date("2024-06-01T00:00:00Z"),
        userId: "u3",
        userName: "Carol",
        userImage: null,
      },
      {
        id: "c2",
        content: "Top comment 2, no replies",
        parentId: null,
        createdAt: new Date("2024-06-04T00:00:00Z"),
        userId: "u1",
        userName: "Alice",
        userImage: null,
      },
    ];
    vi.mocked(db.select).mockReturnValue(mockSelectChain(rows) as any);

    const result = await getCommentsByProject("project-1");

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("c1");
    // Replies are re-sorted ascending by createdAt, regardless of query order.
    expect(result[0].replies.map((r) => r.id)).toEqual(["r1", "r2"]);
    expect(result[1].id).toBe("c2");
    expect(result[1].replies).toEqual([]);
  });

  it("returns an empty array when the project has no comments", async () => {
    vi.mocked(db.select).mockReturnValue(mockSelectChain([]) as any);

    const result = await getCommentsByProject("project-empty");

    expect(result).toEqual([]);
  });

  it("scopes the query to the given project and excludes archived comments", async () => {
    vi.mocked(db.select).mockReturnValue(mockSelectChain([]) as any);

    await getCommentsByProject("project-1");

    expect(eq).toHaveBeenCalledWith(projectComments.projectId, "project-1");
    expect(isNull).toHaveBeenCalledWith(projectComments.archivedAt);
    expect(and).toHaveBeenCalled();
  });
});

describe("getCommentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockPage(rows: unknown[], totalCount: number) {
    const rowsChain: Record<string, ReturnType<typeof vi.fn>> = {};
    for (const step of ["from", "innerJoin", "where", "orderBy", "limit"]) {
      rowsChain[step] = vi.fn().mockReturnValue(rowsChain);
    }
    rowsChain.offset = vi.fn().mockResolvedValue(rows);
    const countChain: Record<string, ReturnType<typeof vi.fn>> = {};
    countChain.from = vi.fn().mockResolvedValue([{ count: totalCount }]);
    vi.mocked(db.select)
      .mockReturnValueOnce(rowsChain as any)
      .mockReturnValueOnce(countChain as any);
    return rowsChain;
  }

  it("returns one page of rows with pagination metadata", async () => {
    const rows = [
      {
        id: "c1",
        content: "Hello",
        parentId: null,
        createdAt: new Date("2024-06-01T00:00:00Z"),
        archivedAt: null,
        projectId: "project-1",
        projectName: "Community Garden",
        userName: "Alice",
      },
    ];
    const chain = mockPage(rows, 120);

    const result = await getCommentsPage({ page: 2 });

    expect(result).toEqual({
      comments: rows,
      totalCount: 120,
      totalPages: 3,
      currentPage: 2,
      pageSize: 50,
    });
    expect(chain.limit).toHaveBeenCalledWith(50);
    expect(chain.offset).toHaveBeenCalledWith(50);
  });

  it("treats an invalid page as the first page", async () => {
    const chain = mockPage([], 0);

    const result = await getCommentsPage({ page: -4 });

    expect(result.currentPage).toBe(1);
    expect(result.totalPages).toBe(0);
    expect(chain.offset).toHaveBeenCalledWith(0);
  });
});
