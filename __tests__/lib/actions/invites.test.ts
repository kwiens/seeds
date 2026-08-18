import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { mockAdminSession, mockSession, setAuthMock } from "../../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/auth-utils", () => ({ canManageProject: vi.fn() }));
vi.mock("@/lib/site-url", () => ({
  getRequestOrigin: vi.fn().mockResolvedValue("https://npcseeds.com"),
}));
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      projects: { findFirst: vi.fn() },
      projectInvites: { findFirst: vi.fn() },
      projectParticipants: { findFirst: vi.fn() },
    },
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { canManageProject } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import {
  acceptInvite,
  cancelInvite,
  createInvite,
} from "@/lib/actions/invites";

const sproutProject = {
  id: "project-1",
  stage: "sprout" as const,
  name: "Bike Share",
};

function insertChain() {
  return { values: vi.fn().mockResolvedValue(undefined) };
}

function updateChain() {
  const where = vi.fn().mockResolvedValue(undefined);
  return { set: vi.fn(() => ({ where })), where };
}

describe("createInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(canManageProject).mockResolvedValue(true);
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      sproutProject as never,
    );
    vi.mocked(db.insert).mockReturnValue(insertChain() as never);
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);
    const result = await createInvite("project-1", "Priya Patel", "guide");
    expect(result).toEqual({ error: "You must be signed in." });
  });

  it("rejects roles outside the team role vocabulary", async () => {
    setAuthMock(auth, mockSession());
    const result = await createInvite("project-1", "Priya Patel", "gardener");
    expect(result).toHaveProperty("error");
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("rejects an empty name", async () => {
    setAuthMock(auth, mockSession());
    const result = await createInvite("project-1", "  ", "guide");
    expect(result).toHaveProperty("error");
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("blocks invites before a project has a team workspace", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue({
      id: "project-1",
      stage: "seed",
      name: "Bike Share",
    } as never);

    const result = await createInvite("project-1", "Priya Patel", "guide");
    expect(result).toEqual({
      error: "Team invites can be sent once a project becomes a Sprout.",
    });
  });

  it("requires admin to invite a Steward", async () => {
    setAuthMock(auth, mockSession({ role: "user" }));
    const result = await createInvite("project-1", "Priya Patel", "steward");
    expect(result).toHaveProperty("error");
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("requires manage permission for non-Steward roles", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(canManageProject).mockResolvedValue(false);

    const result = await createInvite("project-1", "Priya Patel", "guide");
    expect(result).toHaveProperty("error");
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("creates an invite and returns a shareable link", async () => {
    setAuthMock(auth, mockSession({ id: "owner-1" }));
    const chain = insertChain();
    vi.mocked(db.insert).mockReturnValue(chain as never);

    const result = await createInvite("project-1", "Priya Patel", "guide");

    expect(result).toEqual({
      success: true,
      link: expect.stringMatching(/^https:\/\/npcseeds\.com\/invite\/.+/),
    });
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project-1",
        role: "guide",
        invitedName: "Priya Patel",
        createdBy: "owner-1",
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith(
      "/dashboard/projects/project-1/team",
    );
  });

  it("allows an admin to invite a Steward", async () => {
    setAuthMock(auth, mockAdminSession());
    const chain = insertChain();
    vi.mocked(db.insert).mockReturnValue(chain as never);

    const result = await createInvite("project-1", "Gail Steward", "steward");
    expect(result).toHaveProperty("success", true);
  });
});

describe("cancelInvite", () => {
  const pendingInvite = {
    id: "invite-1",
    projectId: "project-1",
    role: "guide",
    invitedName: "Priya Patel",
    acceptedAt: null,
    canceledAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(canManageProject).mockResolvedValue(true);
    vi.mocked(db.query.projectInvites.findFirst).mockResolvedValue(
      pendingInvite as never,
    );
    vi.mocked(db.query.projects.findFirst).mockResolvedValue({
      id: "project-1",
    } as never);
    vi.mocked(db.update).mockReturnValue(updateChain() as never);
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);
    const result = await cancelInvite("invite-1");
    expect(result).toEqual({ error: "You must be signed in." });
  });

  it("errors when the invite doesn't exist", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectInvites.findFirst).mockResolvedValue(undefined);

    const result = await cancelInvite("missing");
    expect(result).toEqual({ error: "Invite not found." });
  });

  it("requires admin to cancel a Steward invite", async () => {
    setAuthMock(auth, mockSession({ role: "user" }));
    vi.mocked(db.query.projectInvites.findFirst).mockResolvedValue({
      ...pendingInvite,
      role: "steward",
    } as never);

    const result = await cancelInvite("invite-1");
    expect(result).toHaveProperty("error");
    expect(db.update).not.toHaveBeenCalled();
  });

  it("cancels the invite", async () => {
    setAuthMock(auth, mockSession());
    const chain = updateChain();
    vi.mocked(db.update).mockReturnValue(chain as never);

    const result = await cancelInvite("invite-1");

    expect(result).toEqual({ success: true });
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ canceledAt: expect.any(Date) }),
    );
    expect(revalidatePath).toHaveBeenCalledWith(
      "/dashboard/projects/project-1/team",
    );
  });
});

describe("acceptInvite", () => {
  const invite = {
    id: "invite-1",
    token: "abc123",
    projectId: "project-1",
    role: "guide",
    invitedName: "Priya Patel",
    createdBy: "owner-1",
    acceptedAt: null,
    canceledAt: null,
    project: { id: "project-1", name: "Bike Share", stage: "sprout" as const },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.query.projectInvites.findFirst).mockResolvedValue(
      invite as never,
    );
    vi.mocked(db.query.projectParticipants.findFirst).mockResolvedValue(
      undefined,
    );
    vi.mocked(db.insert).mockReturnValue(insertChain() as never);
    vi.mocked(db.update).mockReturnValue(updateChain() as never);
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);
    const result = await acceptInvite("abc123");
    expect(result).toEqual({ error: "You must be signed in." });
  });

  it("errors when the token doesn't match an invite", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectInvites.findFirst).mockResolvedValue(undefined);

    const result = await acceptInvite("bogus");
    expect(result).toEqual({ error: "This invite link isn't valid." });
  });

  it("rejects a canceled invite", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectInvites.findFirst).mockResolvedValue({
      ...invite,
      canceledAt: new Date(),
    } as never);

    const result = await acceptInvite("abc123");
    expect(result).toEqual({ error: "This invite has been canceled." });
  });

  it("rejects an already-used invite", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectInvites.findFirst).mockResolvedValue({
      ...invite,
      acceptedAt: new Date(),
    } as never);

    const result = await acceptInvite("abc123");
    expect(result).toEqual({ error: "This invite has already been used." });
  });

  it("rejects if the project no longer has a team workspace", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectInvites.findFirst).mockResolvedValue({
      ...invite,
      project: { ...invite.project, stage: "seed" },
    } as never);

    const result = await acceptInvite("abc123");
    expect(result).toEqual({
      error: "This project's team workspace is no longer available.",
    });
  });

  it("adds the accepting user to the team and marks the invite used", async () => {
    setAuthMock(auth, mockSession({ id: "user-1", name: "Priya Patel" }));
    const insert = insertChain();
    const update = updateChain();
    vi.mocked(db.insert).mockReturnValue(insert as never);
    vi.mocked(db.update).mockReturnValue(update as never);

    const result = await acceptInvite("abc123");

    expect(result).toEqual({
      success: true,
      projectId: "project-1",
      projectName: "Bike Share",
    });
    expect(insert.values).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project-1",
        userId: "user-1",
        role: "guide",
        state: "active",
      }),
    );
    expect(update.set).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptedAt: expect.any(Date),
        acceptedBy: "user-1",
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith(
      "/dashboard/projects/project-1/team",
    );
  });

  it("reactivates an inactive existing role instead of duplicating it", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projectParticipants.findFirst).mockResolvedValue({
      id: "participant-1",
      state: "inactive",
    } as never);
    const update = updateChain();
    vi.mocked(db.update).mockReturnValue(update as never);

    const result = await acceptInvite("abc123");

    expect(result).toHaveProperty("success", true);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("does not duplicate an already-active role", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projectParticipants.findFirst).mockResolvedValue({
      id: "participant-1",
      state: "active",
    } as never);

    const result = await acceptInvite("abc123");

    expect(result).toHaveProperty("success", true);
    expect(db.insert).not.toHaveBeenCalled();
  });
});
