import { describe, expect, it } from "vitest";
import {
  getDefaultProjectWorkspaceSection,
  hasTeamWorkspace,
  projectWorkspacePath,
} from "@/lib/project-workspace-navigation";

describe("project workspace navigation", () => {
  it("keeps team tools hidden for Seed projects", () => {
    expect(hasTeamWorkspace("seed")).toBe(false);
  });

  it.each([
    "sprout",
    "tree",
  ] as const)("keeps team tools available for %s projects", (stage) => {
    expect(hasTeamWorkspace(stage)).toBe(true);
  });

  it("defaults a Seed manager to editing", () => {
    expect(
      getDefaultProjectWorkspaceSection({
        stage: "seed",
        canManage: true,
        canAccessTeam: false,
      }),
    ).toBe("edit");
  });

  it("defaults a Sprout manager to the team workspace", () => {
    expect(
      getDefaultProjectWorkspaceSection({
        stage: "sprout",
        canManage: true,
        canAccessTeam: true,
      }),
    ).toBe("team");
  });

  it("defaults a team-only participant to the team workspace", () => {
    expect(
      getDefaultProjectWorkspaceSection({
        stage: "sprout",
        canManage: false,
        canAccessTeam: true,
      }),
    ).toBe("team");
  });

  it("defaults a mature project manager without active team access to editing", () => {
    expect(
      getDefaultProjectWorkspaceSection({
        stage: "sprout",
        canManage: true,
        canAccessTeam: false,
      }),
    ).toBe("edit");
  });

  it("does not select a private section without access", () => {
    expect(
      getDefaultProjectWorkspaceSection({
        stage: "seed",
        canManage: false,
        canAccessTeam: false,
      }),
    ).toBeNull();
  });

  it("builds canonical workspace paths", () => {
    expect(projectWorkspacePath("project-1")).toBe(
      "/dashboard/projects/project-1",
    );
    expect(projectWorkspacePath("project-1", "updates")).toBe(
      "/dashboard/projects/project-1/updates",
    );
  });
});
