import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      seedTeamMembers: { findFirst: vi.fn() },
    },
  },
}));

import { canEditSeed, canAccessTeamUpdates } from "@/lib/auth-utils";
import { db } from "@/lib/db";

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

describe("canAccessTeamUpdates", () => {
  const seed = { id: "seed-1", createdBy: "user-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false for a signed-out visitor, without querying the roster", async () => {
    const result = await canAccessTeamUpdates(null, seed);
    expect(result).toBe(false);
    expect(db.query.seedTeamMembers.findFirst).not.toHaveBeenCalled();
  });

  it("returns true for the seed creator, without querying the roster", async () => {
    const session = { user: { id: "user-1", role: "user" } };
    const result = await canAccessTeamUpdates(session, seed);
    expect(result).toBe(true);
    expect(db.query.seedTeamMembers.findFirst).not.toHaveBeenCalled();
  });

  it("returns true for an admin, without querying the roster", async () => {
    const session = { user: { id: "admin-1", role: "admin" } };
    const result = await canAccessTeamUpdates(session, seed);
    expect(result).toBe(true);
    expect(db.query.seedTeamMembers.findFirst).not.toHaveBeenCalled();
  });

  it("returns true for a user with a roster row on this Sprout", async () => {
    vi.mocked(db.query.seedTeamMembers.findFirst).mockResolvedValue({
      id: "membership-1",
    } as any);
    const session = { user: { id: "steward-1", role: "user" } };
    const result = await canAccessTeamUpdates(session, seed);
    expect(result).toBe(true);
  });

  it("returns false for a user with no roster row on this Sprout", async () => {
    vi.mocked(db.query.seedTeamMembers.findFirst).mockResolvedValue(undefined);
    const session = { user: { id: "stranger-1", role: "user" } };
    const result = await canAccessTeamUpdates(session, seed);
    expect(result).toBe(false);
  });
});
