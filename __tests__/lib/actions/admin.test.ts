import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { mockAdminSession, mockSession, setAuthMock } from "../../test-utils";

const setCalls: unknown[] = [];
const valueCalls: unknown[] = [];
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    update: vi.fn(() => ({
      set: vi.fn((value: unknown) => {
        setCalls.push(value);
        return { where: vi.fn().mockResolvedValue(undefined) };
      }),
    })),
    insert: vi.fn(() => ({
      values: vi.fn((value: unknown) => {
        valueCalls.push(value);
        return {
          onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
        };
      }),
    })),
    batch: vi.fn().mockResolvedValue([]),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  advanceToSprout,
  advanceToTree,
  approveProject,
  archiveProject,
  revertToSeed,
  revertToSprout,
  unapproveProject,
  unarchiveProject,
} from "@/lib/actions/admin";

describe("admin project lifecycle actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCalls.length = 0;
    valueCalls.length = 0;
  });

  it("rejects non-admin lifecycle changes", async () => {
    setAuthMock(auth, mockSession());
    await expect(advanceToSprout("project-1")).rejects.toThrow("Unauthorized");
    expect(db.update).not.toHaveBeenCalled();
  });

  it("approves without changing project stage", async () => {
    setAuthMock(auth, mockAdminSession());
    await expect(approveProject("project-1")).resolves.toEqual({
      success: true,
    });
    expect(setCalls).toEqual([
      expect.objectContaining({ approvalState: "approved" }),
    ]);
    expect(setCalls[0]).not.toHaveProperty("stage");
    expect(setCalls[0]).not.toHaveProperty("archivedAt");
    expect(valueCalls).toContainEqual(
      expect.objectContaining({
        projectId: "project-1",
        approvedBy: "admin-1",
      }),
    );
    expect(db.batch).toHaveBeenCalledTimes(1);
  });

  it("unapproves without changing project stage", async () => {
    setAuthMock(auth, mockAdminSession());
    await unapproveProject("project-1");
    expect(setCalls[0]).toEqual(
      expect.objectContaining({ approvalState: "pending" }),
    );
    expect(setCalls[0]).not.toHaveProperty("stage");
  });

  it("archives with a timestamp without overwriting lifecycle state", async () => {
    setAuthMock(auth, mockAdminSession());
    await archiveProject("project-1");
    expect(setCalls[0]).toEqual(
      expect.objectContaining({ archivedAt: expect.any(Date) }),
    );
    expect(setCalls[0]).not.toHaveProperty("stage");
    expect(setCalls[0]).not.toHaveProperty("approvalState");
  });

  it("unarchives by clearing only the timestamp", async () => {
    setAuthMock(auth, mockAdminSession());
    await unarchiveProject("project-1");
    expect(setCalls[0]).toEqual(expect.objectContaining({ archivedAt: null }));
  });

  it.each([
    [advanceToSprout, "sprout"],
    [advanceToTree, "tree"],
    [revertToSeed, "seed"],
    [revertToSprout, "sprout"],
  ] as const)("changes only the project stage", async (action, stage) => {
    setAuthMock(auth, mockAdminSession());
    await action("project-1");
    expect(setCalls[0]).toEqual(expect.objectContaining({ stage }));
    expect(setCalls[0]).not.toHaveProperty("approvalState");
    expect(setCalls[0]).not.toHaveProperty("archivedAt");
  });

  it("revalidates every public lifecycle view", async () => {
    setAuthMock(auth, mockAdminSession());
    await advanceToTree("project-1");
    for (const path of [
      "/admin",
      "/",
      "/seeds/project-1",
      "/status/seeds",
      "/status/sprouts",
      "/status/trees",
    ]) {
      expect(revalidatePath).toHaveBeenCalledWith(path);
    }
  });
});
