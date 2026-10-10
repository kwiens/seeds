import { describe, expect, it } from "vitest";
import { routes } from "@/lib/routes";

describe("routes", () => {
  it("builds public project paths", () => {
    expect(routes.project("abc")).toBe("/seeds/abc");
    expect(routes.projectQr("abc")).toBe("/seeds/abc/qr");
    expect(routes.projectUpdate("abc", "u1")).toBe("/seeds/abc/updates/u1");
  });

  it("builds workspace paths with optional sections", () => {
    expect(routes.workspace("abc")).toBe("/dashboard/projects/abc");
    expect(routes.workspace("abc", "team")).toBe(
      "/dashboard/projects/abc/team",
    );
    expect(routes.workspaceEditUpdate("abc", "u1")).toBe(
      "/dashboard/projects/abc/updates/u1/edit",
    );
  });

  it("maps stages to their listing slugs", () => {
    expect(routes.stageListing("seed")).toBe("/status/seeds");
    expect(routes.stageListing("tree")).toBe("/status/trees");
  });

  it("encodes sign-in callbacks", () => {
    expect(routes.signInWithCallback("/dashboard/projects/a b")).toBe(
      "/api/auth/signin?callbackUrl=%2Fdashboard%2Fprojects%2Fa%20b",
    );
  });
});
