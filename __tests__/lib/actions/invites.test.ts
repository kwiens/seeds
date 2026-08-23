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
    },
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    batch: vi.fn(),
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

const PROJECT_ID = "00000000-0000-4000-8000-000000000001";
const INVITE_ID = "00000000-0000-4000-8000-000000000002";
const MISSING_INVITE_ID = "00000000-0000-4000-8000-000000000003";
const TOKEN = "abcdefghijklmnopqrstuvwxyzABCDEF";
const UNUSED_TOKEN = "0123456789abcdefghijklmnopqrstuv";

const sproutProject = {
  id: PROJECT_ID,
  stage: "sprout" as const,
  name: "Bike Share",
};

function insertChain() {
  const onConflictDoUpdate = vi.fn().mockReturnValue({ kind: "upsert" });
  return {
    values: vi.fn().mockResolvedValue(undefined),
    select: vi.fn(() => ({ onConflictDoUpdate })),
    onConflictDoUpdate,
  };
}

function updateChain(returningRows = [{ id: INVITE_ID }]) {
  const returning = vi.fn().mockResolvedValue(returningRows);
  const where = vi.fn(() => ({ returning }));
  return { set: vi.fn(() => ({ where })), where, returning };
}

function selectChain() {
  const where = vi.fn().mockReturnValue({ kind: "participant-select" });
  const from = vi.fn(() => ({ where }));
  return { from, where };
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
    const result = await createInvite(PROJECT_ID, "Priya Patel", "guide");
    expect(result).toEqual({ error: "You must be signed in." });
  });

  it.each([
    ["roles outside the team role vocabulary", "Priya Patel", "gardener"],
    ["an empty name", "  ", "guide"],
  ])("rejects %s", async (_case, name, role) => {
    setAuthMock(auth, mockSession());
    const result = await createInvite(PROJECT_ID, name, role);
    expect(result).toHaveProperty("error");
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("rejects a malformed project ID before querying the database", async () => {
    setAuthMock(auth, mockSession());

    const result = await createInvite("not-a-uuid", "Priya Patel", "guide");

    expect(result).toEqual({ error: "Project not found." });
    expect(db.query.projects.findFirst).not.toHaveBeenCalled();
  });

  it("blocks invites before a project has a team workspace", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue({
      id: PROJECT_ID,
      stage: "seed",
      name: "Bike Share",
    } as never);

    const result = await createInvite(PROJECT_ID, "Priya Patel", "guide");
    expect(result).toEqual({
      error: "Team invites can be sent once a project becomes a Sprout.",
    });
  });

  it("requires admin to invite a Steward", async () => {
    setAuthMock(auth, mockSession({ role: "user" }));
    const result = await createInvite(PROJECT_ID, "Priya Patel", "steward");
    expect(result).toHaveProperty("error");
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("requires manage permission for non-Steward roles", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(canManageProject).mockResolvedValue(false);

    const result = await createInvite(PROJECT_ID, "Priya Patel", "guide");
    expect(result).toHaveProperty("error");
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("creates an invite and returns a shareable link", async () => {
    setAuthMock(auth, mockSession({ id: "owner-1" }));
    const chain = insertChain();
    vi.mocked(db.insert).mockReturnValue(chain as never);

    const result = await createInvite(PROJECT_ID, "Priya Patel", "guide");

    expect(result).toEqual({
      success: true,
      link: expect.stringMatching(/^https:\/\/npcseeds\.com\/invite\/.+/),
    });
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: PROJECT_ID,
        role: "guide",
        invitedName: "Priya Patel",
        createdBy: "owner-1",
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith(
      `/dashboard/projects/${PROJECT_ID}/team`,
    );
  });

  it("allows an admin to invite a Steward", async () => {
    setAuthMock(auth, mockAdminSession());
    const chain = insertChain();
    vi.mocked(db.insert).mockReturnValue(chain as never);

    const result = await createInvite(PROJECT_ID, "Gail Steward", "steward");
    expect(result).toHaveProperty("success", true);
  });
});

describe("cancelInvite", () => {
  const pendingInvite = {
    id: INVITE_ID,
    projectId: PROJECT_ID,
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
    vi.mocked(db.update).mockReturnValue(updateChain() as never);
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);
    const result = await cancelInvite(INVITE_ID);
    expect(result).toEqual({ error: "You must be signed in." });
  });

  it("errors when the invite doesn't exist", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectInvites.findFirst).mockResolvedValue(undefined);

    const result = await cancelInvite(MISSING_INVITE_ID);
    expect(result).toEqual({ error: "Invite not found." });
  });

  it("rejects a malformed invite ID before querying the database", async () => {
    setAuthMock(auth, mockSession());

    const result = await cancelInvite("not-a-uuid");

    expect(result).toEqual({ error: "Invite not found." });
    expect(db.query.projectInvites.findFirst).not.toHaveBeenCalled();
  });

  it("requires admin to cancel a Steward invite", async () => {
    setAuthMock(auth, mockSession({ role: "user" }));
    vi.mocked(db.query.projectInvites.findFirst).mockResolvedValue({
      ...pendingInvite,
      role: "steward",
    } as never);

    const result = await cancelInvite(INVITE_ID);
    expect(result).toHaveProperty("error");
    expect(db.update).not.toHaveBeenCalled();
  });

  it("cancels the invite", async () => {
    setAuthMock(auth, mockSession());
    const chain = updateChain();
    vi.mocked(db.update).mockReturnValue(chain as never);

    const result = await cancelInvite(INVITE_ID);

    expect(result).toEqual({ success: true });
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ canceledAt: expect.any(Date) }),
    );
    expect(revalidatePath).toHaveBeenCalledWith(
      `/dashboard/projects/${PROJECT_ID}/team`,
    );
  });

  it("does not cancel an invite that another request already claimed", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.update).mockReturnValue(updateChain([]) as never);

    const result = await cancelInvite(INVITE_ID);

    expect(result).toEqual({ error: "This invite is no longer pending." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("acceptInvite", () => {
  const invite = {
    id: INVITE_ID,
    token: TOKEN,
    projectId: PROJECT_ID,
    role: "guide",
    invitedName: "Priya Patel",
    createdBy: "owner-1",
    acceptedAt: null,
    canceledAt: null,
    project: { id: PROJECT_ID, name: "Bike Share", stage: "sprout" as const },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.query.projectInvites.findFirst).mockResolvedValue(
      invite as never,
    );
    vi.mocked(db.insert).mockReturnValue(insertChain() as never);
    vi.mocked(db.select).mockReturnValue(selectChain() as never);
    vi.mocked(db.update).mockReturnValue(updateChain() as never);
    vi.mocked(db.batch).mockResolvedValue([
      [{ id: INVITE_ID }],
      { rows: [] },
    ] as never);
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);
    const result = await acceptInvite(TOKEN);
    expect(result).toEqual({ error: "You must be signed in." });
  });

  it("rejects a malformed token before querying the database", async () => {
    setAuthMock(auth, mockSession());

    const result = await acceptInvite("bogus");

    expect(result).toEqual({ error: "This invite link isn't valid." });
    expect(db.query.projectInvites.findFirst).not.toHaveBeenCalled();
  });

  it("errors when a valid token doesn't match an invite", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectInvites.findFirst).mockResolvedValue(undefined);

    const result = await acceptInvite(UNUSED_TOKEN);
    expect(result).toEqual({ error: "This invite link isn't valid." });
  });

  it.each([
    ["canceledAt", "This invite has been canceled."],
    ["acceptedAt", "This invite has already been used."],
  ] as const)("rejects an invite with %s set", async (field, error) => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectInvites.findFirst).mockResolvedValue({
      ...invite,
      [field]: new Date(),
    } as never);

    const result = await acceptInvite(TOKEN);
    expect(result).toEqual({ error });
  });

  it("rejects if the project no longer has a team workspace", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectInvites.findFirst).mockResolvedValue({
      ...invite,
      project: { ...invite.project, stage: "seed" },
    } as never);

    const result = await acceptInvite(TOKEN);
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

    const result = await acceptInvite(TOKEN);

    expect(result).toEqual({
      success: true,
      projectId: PROJECT_ID,
    });
    expect(db.batch).toHaveBeenCalledOnce();
    expect(insert.select).toHaveBeenCalledOnce();
    expect(insert.onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        set: expect.objectContaining({
          state: "active",
          displayName: "Priya Patel",
        }),
      }),
    );
    expect(update.set).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptedAt: expect.any(Date),
        acceptedBy: "user-1",
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith(
      `/dashboard/projects/${PROJECT_ID}/team`,
    );
  });

  it("does not succeed when another request already claimed the invite", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.batch).mockResolvedValueOnce([[], { rows: [] }] as never);

    const result = await acceptInvite(TOKEN);

    expect(result).toEqual({ error: "This invite is no longer available." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
