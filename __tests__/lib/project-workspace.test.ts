import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockProject, mockSession, setAuthMock } from "../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/auth-utils", () => ({
  canAccessTeamWorkspace: vi.fn(),
  canManageProject: vi.fn(),
}));
vi.mock("@/lib/db/queries/projects", () => ({
  getProjectById: vi.fn(),
}));

import { auth } from "@/auth";
import { canAccessTeamWorkspace, canManageProject } from "@/lib/auth-utils";
import { getProjectById } from "@/lib/db/queries/projects";
import {
  getManagedProjectWorkspace,
  getProjectWorkspace,
} from "@/lib/project-workspace";

describe("getProjectWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(canManageProject).mockResolvedValue(false);
    vi.mocked(canAccessTeamWorkspace).mockResolvedValue(false);
  });

  it("redirects to sign-in with a callback URL when unauthenticated", async () => {
    setAuthMock(auth, null);
    await expect(getProjectWorkspace("project-1")).rejects.toThrow(
      "NEXT_REDIRECT:/api/auth/signin?callbackUrl=%2Fdashboard%2Fprojects%2Fproject-1",
    );
    expect(getProjectById).not.toHaveBeenCalled();
  });

  it("calls notFound when the project does not exist", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(getProjectById).mockResolvedValue(null);
    await expect(getProjectWorkspace("missing")).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("redirects to the public seed page when access is denied entirely", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(getProjectById).mockResolvedValue(mockProject() as never);
    vi.mocked(canManageProject).mockResolvedValue(false);
    vi.mocked(canAccessTeamWorkspace).mockResolvedValue(false);
    await expect(getProjectWorkspace("seed-1")).rejects.toThrow(
      "NEXT_REDIRECT:/seeds/seed-1",
    );
  });

  it("returns the workspace for a project manager", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(getProjectById).mockResolvedValue(mockProject() as never);
    vi.mocked(canManageProject).mockResolvedValue(true);
    const workspace = await getProjectWorkspace("seed-1");
    expect(workspace.canManage).toBe(true);
    expect(workspace.canAccessTeam).toBe(false);
    expect(workspace.project.id).toBe("seed-1");
  });

  it("returns the workspace for a team participant without manage rights", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(getProjectById).mockResolvedValue(
      mockProject({ stage: "sprout" }) as never,
    );
    vi.mocked(canManageProject).mockResolvedValue(false);
    vi.mocked(canAccessTeamWorkspace).mockResolvedValue(true);
    const workspace = await getProjectWorkspace("seed-1");
    expect(workspace.canManage).toBe(false);
    expect(workspace.canAccessTeam).toBe(true);
  });

  it("does not check team access for Seed-stage projects", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(getProjectById).mockResolvedValue(
      mockProject({ stage: "seed" }) as never,
    );
    vi.mocked(canManageProject).mockResolvedValue(true);
    await getProjectWorkspace("seed-1");
    expect(canAccessTeamWorkspace).not.toHaveBeenCalled();
  });

  it("does not check team access for archived projects even at Sprout stage", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(getProjectById).mockResolvedValue(
      mockProject({ stage: "sprout", archivedAt: new Date() }) as never,
    );
    vi.mocked(canManageProject).mockResolvedValue(true);
    await getProjectWorkspace("seed-1");
    expect(canAccessTeamWorkspace).not.toHaveBeenCalled();
  });

  it("checks team access for non-archived Sprout and Tree stage projects", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(getProjectById).mockResolvedValue(
      mockProject({ stage: "tree" }) as never,
    );
    vi.mocked(canManageProject).mockResolvedValue(true);
    await getProjectWorkspace("seed-1");
    expect(canAccessTeamWorkspace).toHaveBeenCalled();
  });
});

describe("getManagedProjectWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the workspace when the caller can manage the project", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(getProjectById).mockResolvedValue(mockProject() as never);
    vi.mocked(canManageProject).mockResolvedValue(true);
    vi.mocked(canAccessTeamWorkspace).mockResolvedValue(false);
    const workspace = await getManagedProjectWorkspace("seed-1");
    expect(workspace.canManage).toBe(true);
  });

  it("redirects a non-manager with team access to the team section", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(getProjectById).mockResolvedValue(
      mockProject({ stage: "sprout" }) as never,
    );
    vi.mocked(canManageProject).mockResolvedValue(false);
    vi.mocked(canAccessTeamWorkspace).mockResolvedValue(true);
    await expect(getManagedProjectWorkspace("seed-1")).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard/projects/seed-1/team",
    );
  });

  it("redirects a non-manager without team access to the public seed page", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(getProjectById).mockResolvedValue(mockProject() as never);
    vi.mocked(canManageProject).mockResolvedValue(false);
    vi.mocked(canAccessTeamWorkspace).mockResolvedValue(false);
    // getProjectWorkspace itself redirects to the public page before
    // getManagedProjectWorkspace's own check runs.
    await expect(getManagedProjectWorkspace("seed-1")).rejects.toThrow(
      "NEXT_REDIRECT:/seeds/seed-1",
    );
  });
});
