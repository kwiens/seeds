import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { mockSession, setAuthMock } from "../../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    query: { projectParticipants: { findFirst: vi.fn() } },
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { toggleSupport } from "@/lib/actions/support";

function insertChain() {
  return { values: vi.fn().mockResolvedValue(undefined) };
}

function updateChain(promoted = false) {
  const returning = vi
    .fn()
    .mockResolvedValue(promoted ? [{ id: "project-1" }] : []);
  const where = vi.fn(() => ({ returning }));
  const set = vi.fn(() => ({ where }));
  return { set, where, returning };
}

const participant = {
  id: "participant-1",
  projectId: "project-1",
  userId: "user-1",
  displayName: "Test User",
  role: "supporter" as const,
  state: "active" as const,
  addedBy: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("toggleSupport participant state", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires authentication", async () => {
    setAuthMock(auth, null);
    await expect(toggleSupport("project-1")).resolves.toHaveProperty("error");
  });

  it("creates an active supporter role for a new supporter", async () => {
    setAuthMock(auth, mockSession({ name: "A Supporter" }));
    vi.mocked(db.query.projectParticipants.findFirst).mockResolvedValue(
      undefined,
    );
    const insert = insertChain();
    vi.mocked(db.insert).mockReturnValue(insert as never);
    vi.mocked(db.update).mockReturnValue(updateChain() as never);

    await expect(toggleSupport("project-1")).resolves.toEqual({
      success: true,
    });
    expect(insert.values).toHaveBeenCalledWith({
      projectId: "project-1",
      userId: "user-1",
      displayName: "A Supporter",
      role: "supporter",
      state: "active",
      addedBy: "user-1",
    });
  });

  it("retains the participant row and marks active support inactive", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectParticipants.findFirst).mockResolvedValue(
      participant,
    );
    const update = updateChain();
    vi.mocked(db.update).mockReturnValue(update as never);

    await toggleSupport("project-1");
    expect(update.set).toHaveBeenCalledWith(
      expect.objectContaining({ state: "inactive" }),
    );
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("reactivates an inactive supporter row", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectParticipants.findFirst).mockResolvedValue({
      ...participant,
      state: "inactive",
    });
    const stateUpdate = updateChain();
    const autoApprove = updateChain();
    vi.mocked(db.update)
      .mockReturnValueOnce(stateUpdate as never)
      .mockReturnValueOnce(autoApprove as never);

    await toggleSupport("project-1");
    expect(stateUpdate.set).toHaveBeenCalledWith(
      expect.objectContaining({ state: "active" }),
    );
    expect(db.update).toHaveBeenCalledTimes(2);
  });

  it("attempts approval only when support becomes active", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectParticipants.findFirst).mockResolvedValue(
      undefined,
    );
    vi.mocked(db.insert).mockReturnValue(insertChain() as never);
    vi.mocked(db.update).mockReturnValue(updateChain() as never);
    await toggleSupport("project-1");
    expect(db.update).toHaveBeenCalledTimes(1);
  });

  it("revalidates lifecycle listings when auto-approval fires", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectParticipants.findFirst).mockResolvedValue(
      undefined,
    );
    vi.mocked(db.insert).mockReturnValue(insertChain() as never);
    vi.mocked(db.update).mockReturnValue(updateChain(true) as never);
    await toggleSupport("project-1");
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(revalidatePath).toHaveBeenCalledWith("/status/seeds");
  });

  it("treats a concurrent unique insert as an idempotent success", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectParticipants.findFirst).mockResolvedValue(
      undefined,
    );
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockRejectedValue({ code: "23505" }),
    } as never);
    await expect(toggleSupport("project-1")).resolves.toEqual({
      success: true,
    });
  });
});
