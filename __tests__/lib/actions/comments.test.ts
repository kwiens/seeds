import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import {
  mockAdminSession,
  mockDbInsertSimpleChain,
  mockDbUpdateChain,
  mockSession,
  setAuthMock,
} from "../../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/auth-utils", () => ({
  canManageProject: vi.fn(
    async (session, project) =>
      session?.user?.role === "admin" ||
      session?.user?.id === project.createdBy,
  ),
}));
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      projectComments: { findFirst: vi.fn() },
    },
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  addComment,
  archiveComment,
  unarchiveComment,
} from "@/lib/actions/comments";

function mockCommentRow(overrides?: Record<string, unknown>) {
  return {
    id: "comment-1",
    projectId: "seed-1",
    userId: "user-1",
    content: "Great progress!",
    parentId: null,
    createdAt: new Date("2024-01-01"),
    archivedAt: null,
    project: { id: "seed-1", createdBy: "user-1" },
    ...overrides,
  };
}

describe("addComment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);
    const result = await addComment("seed-1", "Nice work");
    expect(result).toEqual({
      error: "You must be signed in to share an insight.",
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("rejects empty content", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    const result = await addComment("seed-1", "   ");
    expect(result).toEqual({
      error: "Insight must be between 1 and 1,000 characters.",
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("rejects content over the max length", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    const tooLong = "a".repeat(1001);
    const result = await addComment("seed-1", tooLong);
    expect(result).toEqual({
      error: "Insight must be between 1 and 1,000 characters.",
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("creates a top-level comment as an authenticated user", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    const chain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);

    const result = await addComment("seed-1", "  Great progress!  ");

    expect(result).toEqual({ success: true });
    expect(chain.values).toHaveBeenCalledWith({
      projectId: "seed-1",
      userId: "user-1",
      content: "Great progress!",
      parentId: null,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1");
    expect(db.query.projectComments.findFirst).not.toHaveBeenCalled();
  });

  it("returns error when the parent comment does not exist", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projectComments.findFirst).mockResolvedValue(undefined);

    const result = await addComment("seed-1", "A reply", "parent-1");
    expect(result).toEqual({ error: "Parent comment not found." });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("returns error when the parent comment belongs to a different project", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projectComments.findFirst).mockResolvedValue(
      mockCommentRow({ project: { id: "other-seed", createdBy: "user-1" } }),
    );

    const result = await addComment("seed-1", "A reply", "parent-1");
    expect(result).toEqual({ error: "Parent comment not found." });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("rejects a reply to a reply", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projectComments.findFirst).mockResolvedValue(
      mockCommentRow({ parentId: "grandparent-1" }),
    );

    const result = await addComment("seed-1", "A reply", "parent-1");
    expect(result).toEqual({
      error: "Replies to replies are not supported.",
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("rejects a reply from a non-Gardener non-admin", async () => {
    setAuthMock(auth, mockSession({ id: "other-user" }));
    vi.mocked(db.query.projectComments.findFirst).mockResolvedValue(
      mockCommentRow(),
    );

    const result = await addComment("seed-1", "A reply", "parent-1");
    expect(result).toEqual({
      error: "Only project Gardeners or admins can reply.",
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("allows a Gardener to reply to a top-level comment", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projectComments.findFirst).mockResolvedValue(
      mockCommentRow(),
    );
    const chain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);

    const result = await addComment("seed-1", "A reply", "parent-1");

    expect(result).toEqual({ success: true });
    expect(chain.values).toHaveBeenCalledWith({
      projectId: "seed-1",
      userId: "user-1",
      content: "A reply",
      parentId: "parent-1",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1");
  });

  it("allows an admin to reply on any project", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.projectComments.findFirst).mockResolvedValue(
      mockCommentRow({ project: { id: "seed-1", createdBy: "someone-else" } }),
    );
    const chain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);

    const result = await addComment("seed-1", "A reply", "parent-1");

    expect(result).toEqual({ success: true });
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "admin-1" }),
    );
  });
});

describe("archiveComment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);
    const result = await archiveComment("comment-1");
    expect(result).toEqual({ error: "You must be signed in." });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("returns error when comment not found", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projectComments.findFirst).mockResolvedValue(undefined);

    const result = await archiveComment("nonexistent");
    expect(result).toEqual({ error: "Comment not found." });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("rejects a non-Gardener non-admin", async () => {
    setAuthMock(auth, mockSession({ id: "other-user" }));
    vi.mocked(db.query.projectComments.findFirst).mockResolvedValue(
      mockCommentRow(),
    );

    const result = await archiveComment("comment-1");
    expect(result).toEqual({
      error: "You do not have permission to remove this insight.",
    });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("archives a top-level comment and cascades to its replies", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projectComments.findFirst).mockResolvedValue(
      mockCommentRow(),
    );
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await archiveComment("comment-1");

    expect(result).toEqual({ success: true });
    // Called once for replies (where parentId = comment-1), once for the
    // comment itself (where id = comment-1).
    expect(db.update).toHaveBeenCalledTimes(2);
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ archivedAt: expect.any(Date) }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("does not cascade when archiving a reply", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projectComments.findFirst).mockResolvedValue(
      mockCommentRow({ id: "reply-1", parentId: "comment-1" }),
    );
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await archiveComment("reply-1");

    expect(result).toEqual({ success: true });
    expect(db.update).toHaveBeenCalledTimes(1);
  });

  it("allows an admin to archive a comment on any project", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.projectComments.findFirst).mockResolvedValue(
      mockCommentRow({ project: { id: "seed-1", createdBy: "someone-else" } }),
    );
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await archiveComment("comment-1");
    expect(result).toEqual({ success: true });
  });
});

describe("unarchiveComment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);
    const result = await unarchiveComment("comment-1");
    expect(result).toEqual({
      error: "Only admins can restore archived insights.",
    });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("rejects a non-admin signed-in user", async () => {
    setAuthMock(auth, mockSession({ id: "user-1", role: "user" }));
    const result = await unarchiveComment("comment-1");
    expect(result).toEqual({
      error: "Only admins can restore archived insights.",
    });
    expect(db.update).not.toHaveBeenCalled();
    expect(db.query.projectComments.findFirst).not.toHaveBeenCalled();
  });

  it("returns error when comment not found", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.projectComments.findFirst).mockResolvedValue(undefined);

    const result = await unarchiveComment("nonexistent");
    expect(result).toEqual({ error: "Comment not found." });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("restores an archived comment as an admin", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.projectComments.findFirst).mockResolvedValue(
      mockCommentRow({ archivedAt: new Date("2024-01-02") }),
    );
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await unarchiveComment("comment-1");

    expect(result).toEqual({ success: true });
    expect(chain.set).toHaveBeenCalledWith({ archivedAt: null });
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });
});
