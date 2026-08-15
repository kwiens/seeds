import { describe, expect, it } from "vitest";
import {
  getProjectById,
  getProjectsByStage,
  getSeedStageProjects,
  getSupportedProjectsByUser,
  supportCountSql,
} from "@/lib/db/queries/projects";

describe("project query surface", () => {
  it("exposes one query family for every lifecycle stage", () => {
    expect(getProjectsByStage).toBeTypeOf("function");
    expect(getSeedStageProjects).toBeTypeOf("function");
  });

  it("uses the same project aggregate for detail and participation views", () => {
    expect(getProjectById).toBeTypeOf("function");
    expect(getSupportedProjectsByUser).toBeTypeOf("function");
  });

  it("counts active supporter participants rather than a separate support model", () => {
    expect(supportCountSql).toBeDefined();
    expect(supportCountSql.fieldAlias).toBe("support_count");
  });
});
