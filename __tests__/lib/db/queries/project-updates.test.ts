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
  getPublicProjectUpdateById,
  getPublicProjectUpdates,
  getTeamProjectUpdates,
} from "@/lib/db/queries/project-updates";
import { projectUpdates } from "@/lib/db/schema";

// Fluent select-chain mock matching db.select().from().innerJoin().where()...
// The terminal method (orderBy or limit) resolves to `rows`.
function mockSelectChain(rows: unknown[]) {
  const chain: Record<string, any> = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.innerJoin = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockResolvedValue(rows);
  chain.limit = vi.fn().mockResolvedValue(rows);
  return chain;
}

describe("getPublicProjectUpdates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the mapped public updates for a project", async () => {
    const rows = [
      {
        id: "update-1",
        projectId: "project-1",
        title: "Progress",
        body: { type: "doc", content: [] },
        photos: ["https://example.com/a.jpg"],
        createdAt: new Date("2024-06-02T00:00:00Z"),
        updatedAt: new Date("2024-06-02T00:00:00Z"),
        authorId: "user-1",
        authorName: "Alice",
        authorImage: null,
      },
    ];
    vi.mocked(db.select).mockReturnValue(mockSelectChain(rows) as any);

    const result = await getPublicProjectUpdates("project-1");

    expect(result).toEqual(rows);
  });

  it("returns an empty array when the project has no public updates", async () => {
    vi.mocked(db.select).mockReturnValue(mockSelectChain([]) as any);

    const result = await getPublicProjectUpdates("project-empty");

    expect(result).toEqual([]);
  });

  it("scopes to the project, public visibility, and top-level updates only", async () => {
    vi.mocked(db.select).mockReturnValue(mockSelectChain([]) as any);

    await getPublicProjectUpdates("project-1");

    expect(eq).toHaveBeenCalledWith(projectUpdates.projectId, "project-1");
    expect(eq).toHaveBeenCalledWith(projectUpdates.visibility, "public");
    expect(isNull).toHaveBeenCalledWith(projectUpdates.parentId);
    expect(and).toHaveBeenCalled();
  });
});

describe("getPublicProjectUpdateById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the update when found", async () => {
    const row = {
      id: "update-1",
      projectId: "project-1",
      title: "Progress",
      body: { type: "doc", content: [] },
      photos: [],
      createdBy: "user-1",
      createdAt: new Date("2024-06-02T00:00:00Z"),
      updatedAt: new Date("2024-06-02T00:00:00Z"),
      authorName: "Alice",
      authorImage: null,
    };
    vi.mocked(db.select).mockReturnValue(mockSelectChain([row]) as any);

    const result = await getPublicProjectUpdateById("update-1");

    expect(result).toEqual(row);
  });

  it("returns null when no matching public update exists", async () => {
    vi.mocked(db.select).mockReturnValue(mockSelectChain([]) as any);

    const result = await getPublicProjectUpdateById("missing-update");

    expect(result).toBeNull();
  });

  it("filters by update id and public visibility, limited to one row", async () => {
    const chain = mockSelectChain([]);
    vi.mocked(db.select).mockReturnValue(chain as any);

    await getPublicProjectUpdateById("update-1");

    expect(eq).toHaveBeenCalledWith(projectUpdates.id, "update-1");
    expect(eq).toHaveBeenCalledWith(projectUpdates.visibility, "public");
    expect(chain.limit).toHaveBeenCalledWith(1);
  });
});

describe("getTeamProjectUpdates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("groups replies under their parent update and sorts them chronologically", async () => {
    const rows = [
      {
        id: "update-1",
        title: "Internal kickoff",
        body: "Team only",
        parentId: null,
        attachments: [],
        createdAt: new Date("2024-06-03T00:00:00Z"),
        userId: "u1",
        userName: "Alice",
        userImage: null,
        userRole: "admin",
      },
      {
        id: "reply-2",
        title: null,
        body: "Second reply",
        parentId: "update-1",
        attachments: [],
        createdAt: new Date("2024-06-02T00:00:00Z"),
        userId: "u2",
        userName: "Bob",
        userImage: null,
        userRole: "user",
      },
      {
        id: "reply-1",
        title: null,
        body: "First reply",
        parentId: "update-1",
        attachments: [],
        createdAt: new Date("2024-06-01T00:00:00Z"),
        userId: "u3",
        userName: "Carol",
        userImage: null,
        userRole: "user",
      },
      {
        id: "update-2",
        title: "No replies yet",
        body: "Standalone",
        parentId: null,
        attachments: [],
        createdAt: new Date("2024-06-04T00:00:00Z"),
        userId: "u1",
        userName: "Alice",
        userImage: null,
        userRole: "admin",
      },
    ];
    vi.mocked(db.select).mockReturnValue(mockSelectChain(rows) as any);

    const result = await getTeamProjectUpdates("project-1");

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("update-1");
    // Replies are re-sorted ascending by createdAt, regardless of query order.
    expect(result[0].replies.map((r) => r.id)).toEqual(["reply-1", "reply-2"]);
    expect(result[1].id).toBe("update-2");
    expect(result[1].replies).toEqual([]);
  });

  it("returns an empty array when the project has no team updates", async () => {
    vi.mocked(db.select).mockReturnValue(mockSelectChain([]) as any);

    const result = await getTeamProjectUpdates("project-empty");

    expect(result).toEqual([]);
  });

  it("scopes the query to the project and team visibility", async () => {
    vi.mocked(db.select).mockReturnValue(mockSelectChain([]) as any);

    await getTeamProjectUpdates("project-1");

    expect(eq).toHaveBeenCalledWith(projectUpdates.projectId, "project-1");
    expect(eq).toHaveBeenCalledWith(projectUpdates.visibility, "team");
    expect(and).toHaveBeenCalled();
  });
});
