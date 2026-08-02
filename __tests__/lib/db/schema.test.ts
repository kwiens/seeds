import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { describe, expect, it } from "vitest";
import * as schema from "@/lib/db/schema";

const testDb = drizzle(neon("postgresql://user:password@localhost/database"), {
  schema,
});

describe("project aggregate schema", () => {
  it("defines lifecycle as independent stage, approval, and archive fields", () => {
    expect(schema.projectStageEnum.enumValues).toEqual([
      "seed",
      "sprout",
      "tree",
    ]);
    expect(schema.approvalStateEnum.enumValues).toEqual([
      "draft",
      "pending",
      "approved",
    ]);
    expect(schema.projects.stage).toBeDefined();
    expect(schema.projects.approvalState).toBeDefined();
    expect(schema.projects.archivedAt).toBeDefined();
  });

  it("keeps the early estimate separate from detailed budgets", () => {
    expect(schema.projects.budgetEstimate).toBeDefined();
    expect(schema.projectBudgets.status).toBeDefined();
    expect(schema.projectBudgets.isPublic).toBeDefined();
  });

  it("stores participant roles and states in one model", () => {
    expect(schema.participantRoleEnum.enumValues).toContain("supporter");
    expect(schema.participantRoleEnum.enumValues).toContain("gardener");
    expect(schema.participantRoleEnum.enumValues).toContain("member");
    expect(schema.participantStateEnum.enumValues).toEqual([
      "prospective",
      "invited",
      "active",
      "inactive",
    ]);
  });

  it("stores public and team updates in one visibility-aware model", () => {
    expect(schema.updateVisibilityEnum.enumValues).toEqual(["public", "team"]);
    expect(schema.projectUpdates.visibility).toBeDefined();
    expect(schema.projectUpdates.parentId).toBeDefined();
    expect(schema.projectUpdates.attachments).toBeDefined();
  });

  it("compiles participant relations with both user references", () => {
    expect(() =>
      testDb.query.projectParticipants
        .findMany({ with: { user: true, addedByUser: true, project: true } })
        .toSQL(),
    ).not.toThrow();
  });

  it("compiles unified update relations", () => {
    expect(() =>
      testDb.query.projectUpdates
        .findMany({
          with: { author: true, project: true, parent: true, replies: true },
        })
        .toSQL(),
    ).not.toThrow();
  });
});
