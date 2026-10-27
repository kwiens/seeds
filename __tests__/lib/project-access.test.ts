import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockAdminSession, mockSession, setAuthMock } from "../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/auth-utils", () => ({
  canAccessTeamWorkspace: vi.fn(),
  canManageProject: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: { query: { projects: { findFirst: vi.fn() } } },
}));

import { auth } from "@/auth";
import { canAccessTeamWorkspace, canManageProject } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import {
  checkProjectAccess,
  getProjectAccess,
  isTeamWorkspaceAvailable,
  requireProjectAccess,
} from "@/lib/project-access";

const sprout = { id: "p1", stage: "sprout" as const, archivedAt: null };
const seed = { id: "p1", stage: "seed" as const, archivedAt: null };
const archivedSprout = { ...sprout, archivedAt: new Date("2026-01-01") };

describe("isTeamWorkspaceAvailable", () => {
  it("is true only for unarchived Sprouts and Trees", () => {
    expect(isTeamWorkspaceAvailable(seed)).toBe(false);
    expect(isTeamWorkspaceAvailable(sprout)).toBe(true);
    expect(isTeamWorkspaceAvailable({ ...sprout, stage: "tree" })).toBe(true);
    expect(isTeamWorkspaceAvailable(archivedSprout)).toBe(false);
  });
});

describe("getProjectAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(canManageProject).mockResolvedValue(true);
    vi.mocked(canAccessTeamWorkspace).mockResolvedValue(true);
  });

  it("never grants team access when the workspace does not exist", async () => {
    const access = await getProjectAccess(mockSession(), seed);
    expect(access).toEqual({
      canManage: true,
      canAccessTeam: false,
      teamWorkspaceAvailable: false,
    });
    expect(canAccessTeamWorkspace).not.toHaveBeenCalled();
  });

  it("treats archived projects as having no workspace", async () => {
    const access = await getProjectAccess(mockSession(), archivedSprout);
    expect(access.canAccessTeam).toBe(false);
    expect(access.canManage).toBe(true);
  });

  it("asks the participant table for live Sprouts", async () => {
    const access = await getProjectAccess(mockSession(), sprout);
    expect(access.canAccessTeam).toBe(true);
    expect(canAccessTeamWorkspace).toHaveBeenCalledWith(
      expect.anything(),
      sprout,
    );
  });
});

describe("checkProjectAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects signed-out users first", async () => {
    expect(await checkProjectAccess(null, sprout, { level: "team" })).toBe(
      "You must be signed in.",
    );
  });

  it("blocks team writes on archived projects even for admins", async () => {
    expect(
      await checkProjectAccess(mockAdminSession(), archivedSprout, {
        level: "team",
      }),
    ).toBe("This project has been archived.");
    expect(canAccessTeamWorkspace).not.toHaveBeenCalled();
  });

  it("uses the caller's wording for a missing workspace", async () => {
    expect(
      await checkProjectAccess(mockSession(), seed, {
        level: "manage",
        requireWorkspace: true,
        unavailable: "Budgets arrive at Sprout.",
      }),
    ).toBe("Budgets arrive at Sprout.");
  });

  it("does not require a workspace for manage-level checks by default", async () => {
    vi.mocked(canManageProject).mockResolvedValue(true);
    expect(
      await checkProjectAccess(mockSession(), seed, { level: "manage" }),
    ).toBeNull();
  });

  it("maps admin level to the session role only", async () => {
    expect(
      await checkProjectAccess(mockSession(), sprout, { level: "admin" }),
    ).toBe("Only admins can do that.");
    expect(
      await checkProjectAccess(mockAdminSession(), sprout, { level: "admin" }),
    ).toBeNull();
    expect(canManageProject).not.toHaveBeenCalled();
  });
});

describe("requireProjectAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the standard error when the project is missing", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(undefined);
    expect(await requireProjectAccess("nope", { level: "manage" })).toEqual({
      error: "Project not found.",
    });
  });

  it("hands the row through to the capability check", async () => {
    setAuthMock(auth, mockSession());
    const row = { ...sprout, createdBy: "user-1" };
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(row as never);
    vi.mocked(canManageProject).mockResolvedValue(true);
    const result = await requireProjectAccess("p1", { level: "manage" });
    expect(canManageProject).toHaveBeenCalledWith(expect.anything(), row);
    expect(result).toMatchObject({ project: { id: "p1" } });
  });
});
