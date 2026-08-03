import { describe, expect, it } from "vitest";
import { hasSitewideMyProjectsAccess } from "@/lib/db/queries/my-projects";

describe("My Sprouts visibility", () => {
  it("lets council members see every active Sprout and Tree", () => {
    expect(hasSitewideMyProjectsAccess("council")).toBe(true);
  });

  it("requires admins to participate in projects listed under My Sprouts", () => {
    expect(hasSitewideMyProjectsAccess("admin")).toBe(false);
  });

  it.each([
    "user",
    "",
    "unknown",
  ])("requires project participation for the %s role", (role) => {
    expect(hasSitewideMyProjectsAccess(role)).toBe(false);
  });
});
