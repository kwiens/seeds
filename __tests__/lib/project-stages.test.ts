import { describe, expect, it } from "vitest";
import {
  hasTeamWorkspace,
  projectDisplayState,
  projectStages,
  projectStageToSlug,
  publicProjectStageOrder,
  slugToProjectStage,
} from "@/lib/project-stages";

describe("project lifecycle", () => {
  it.each([
    ["seeds", "seed"],
    ["sprouts", "sprout"],
    ["trees", "tree"],
  ] as const)("maps %s to the %s stage", (slug, stage) => {
    expect(slugToProjectStage(slug)).toBe(stage);
    expect(projectStageToSlug(stage)).toBe(slug);
  });

  it("rejects unknown stage slugs", () => {
    expect(slugToProjectStage("archived")).toBeUndefined();
    expect(slugToProjectStage("")).toBeUndefined();
  });

  it("orders stages by accumulating capability", () => {
    expect(publicProjectStageOrder).toEqual(["seed", "sprout", "tree"]);
  });

  it.each([
    ["seed", false],
    ["sprout", true],
    ["tree", true],
  ] as const)("sets team workspace capability for %s", (stage, expected) => {
    expect(hasTeamWorkspace(stage)).toBe(expected);
  });

  it("keeps public labels independent from approval", () => {
    expect(projectStages.seed.label).toBe("Seed");
    expect(projectStages.sprout.label).toBe("Sprout");
    expect(projectStages.tree.label).toBe("Tree");
  });
});

describe("projectDisplayState", () => {
  it.each([
    ["draft", "Draft Sprout"],
    ["pending", "Pending Sprout"],
    ["approved", "Sprout"],
  ] as const)("renders %s approval independently", (approvalState, label) => {
    expect(
      projectDisplayState({ stage: "sprout", approvalState, archivedAt: null }),
    ).toBe(label);
  });

  it("lets archival override stage and approval without erasing either", () => {
    const project = {
      stage: "tree" as const,
      approvalState: "approved" as const,
      archivedAt: new Date(),
    };
    expect(projectDisplayState(project)).toBe("Archived");
    expect(project.stage).toBe("tree");
    expect(project.approvalState).toBe("approved");
  });
});
