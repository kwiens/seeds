import { describe, expect, it } from "vitest";
import { canEditSeed } from "@/lib/auth-utils";

describe("canEditSeed", () => {
  const seed = { createdBy: "user-1" };

  it("returns false for null session", () => {
    expect(canEditSeed(null, seed)).toBe(false);
  });

  it("returns false for undefined session", () => {
    expect(canEditSeed(undefined, seed)).toBe(false);
  });

  it("returns false for session with no user id", () => {
    const session = { user: { id: "", role: "user" } };
    expect(canEditSeed(session, seed)).toBe(false);
  });

  it("returns true when user is the seed creator", () => {
    const session = { user: { id: "user-1", role: "user" } };
    expect(canEditSeed(session, seed)).toBe(true);
  });

  it("returns false when user is neither creator nor admin", () => {
    const session = { user: { id: "user-2", role: "user" } };
    expect(canEditSeed(session, seed)).toBe(false);
  });

  it("returns true when user is admin (not creator)", () => {
    const session = { user: { id: "admin-1", role: "admin" } };
    expect(canEditSeed(session, seed)).toBe(true);
  });
});
