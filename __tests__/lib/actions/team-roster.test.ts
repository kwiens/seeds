import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockAdminSession, mockSession, setAuthMock } from "../../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/auth-utils", () => ({ canManageProject: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      projects: { findFirst: vi.fn() },
      projectParticipants: { findFirst: vi.fn(), findMany: vi.fn() },
      users: { findFirst: vi.fn() },
    },
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { canManageProject } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { addTeamMember, removeTeamMember } from "@/lib/actions/team-roster";

const target = {
  id: "target-1",
  email: "guide@example.com",
  name: "Guide Person",
  role: "user" as const,
  image: null,
  createdAt: new Date(),
};

function insertChain() {
  return { values: vi.fn().mockResolvedValue(undefined) };
}

function updateChain() {
  const where = vi.fn().mockResolvedValue(undefined);
  return { set: vi.fn(() => ({ where })), where };
}

describe("consolidated project roster", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(canManageProject).mockResolvedValue(true);
    vi.mocked(db.query.projects.findFirst).mockResolvedValue({
      id: "project-1",
      stage: "sprout",
    } as never);
    vi.mocked(db.query.users.findFirst).mockResolvedValue(target as never);
    vi.mocked(db.query.projectParticipants.findFirst).mockResolvedValue(
      undefined,
    );
    vi.mocked(db.query.projectParticipants.findMany).mockResolvedValue(
      [] as never,
    );
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);
    await expect(
      addTeamMember("project-1", target.email, "guide"),
    ).resolves.toHaveProperty("error");
  });

  it("rejects roles outside the participant role vocabulary", async () => {
    setAuthMock(auth, mockSession());
    await expect(
      addTeamMember("project-1", target.email, "wizard"),
    ).resolves.toEqual({ error: "Invalid role." });
  });

  it("does not add team roles at Seed stage", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue({
      id: "project-1",
      stage: "seed",
    } as never);
    await expect(
      addTeamMember("project-1", target.email, "guide"),
    ).resolves.toEqual({
      error: "Team members can be managed after a project becomes a Sprout.",
    });
  });

  it.each([
    "sprout",
    "tree",
  ] as const)("adds an active role at the %s stage", async (stage) => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue({
      id: "project-1",
      stage,
    } as never);
    const chain = insertChain();
    vi.mocked(db.insert).mockReturnValue(chain as never);
    await expect(
      addTeamMember("project-1", target.email, "guide"),
    ).resolves.toEqual({ success: true });
    expect(chain.values).toHaveBeenCalledWith({
      projectId: "project-1",
      userId: "target-1",
      displayName: "Guide Person",
      role: "guide",
      state: "active",
      addedBy: "user-1",
    });
  });

  it("requires project leadership for ordinary team roles", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(canManageProject).mockResolvedValue(false);
    await expect(
      addTeamMember("project-1", target.email, "guide"),
    ).resolves.toHaveProperty("error");
  });

  it("reserves steward assignment for admins", async () => {
    setAuthMock(auth, mockSession());
    await expect(
      addTeamMember("project-1", target.email, "steward"),
    ).resolves.toHaveProperty("error");
  });

  it("allows admins to assign stewards", async () => {
    setAuthMock(auth, mockAdminSession());
    const chain = insertChain();
    vi.mocked(db.insert).mockReturnValue(chain as never);
    await expect(
      addTeamMember("project-1", target.email, "steward"),
    ).resolves.toEqual({ success: true });
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ role: "steward", state: "active" }),
    );
  });

  it("reactivates an inactive role instead of inserting a duplicate", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectParticipants.findFirst).mockResolvedValue({
      id: "participant-1",
      state: "inactive",
    } as never);
    const chain = updateChain();
    vi.mocked(db.update).mockReturnValue(chain as never);
    await expect(
      addTeamMember("project-1", target.email, "guide"),
    ).resolves.toEqual({ success: true });
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ state: "active", displayName: "Guide Person" }),
    );
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("rejects assigning the same active role twice", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectParticipants.findFirst).mockResolvedValue({
      id: "participant-1",
      state: "active",
    } as never);
    await expect(
      addTeamMember("project-1", target.email, "guide"),
    ).resolves.toEqual({ error: "This person is already a Guide." });
  });

  it("marks team roles inactive so participant history is preserved", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectParticipants.findMany).mockResolvedValue([
      { id: "participant-1", role: "guide" },
      { id: "participant-2", role: "member" },
    ] as never);
    const chain = updateChain();
    vi.mocked(db.update).mockReturnValue(chain as never);
    await expect(removeTeamMember("project-1", "target-1")).resolves.toEqual({
      success: true,
    });
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ state: "inactive" }),
    );
  });

  it("does not treat supporter-only participation as team membership", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectParticipants.findMany).mockResolvedValue(
      [] as never,
    );
    await expect(removeTeamMember("project-1", "target-1")).resolves.toEqual({
      error: "This person isn't on the team.",
    });
  });

  it.each([
    "gardener",
    "steward",
  ] as const)("requires an admin to remove an active %s role", async (role) => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectParticipants.findMany).mockResolvedValue([
      { id: "participant-1", role },
    ] as never);
    await expect(
      removeTeamMember("project-1", "target-1"),
    ).resolves.toHaveProperty("error");
    expect(db.update).not.toHaveBeenCalled();
  });
});
