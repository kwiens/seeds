import { describe, expect, it, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import {
  mockSession,
  mockAdminSession,
  mockDbDeleteChain,
  mockDbInsertSimpleChain,
  setAuthMock,
} from "../../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      seeds: { findFirst: vi.fn() },
      seedTeamMembers: { findFirst: vi.fn() },
      users: { findFirst: vi.fn() },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { addTeamMember, removeTeamMember } from "@/lib/actions/team-roster";

function mockSeedRow(overrides?: Record<string, unknown>) {
  return { id: "seed-1", createdBy: "user-1", ...overrides };
}

function mockTargetUser(overrides?: Record<string, unknown>) {
  return {
    id: "target-1",
    email: "guide@example.com",
    role: "user",
    ...overrides,
  };
}

describe("addTeamMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);
    const result = await addTeamMember("seed-1", "guide@example.com", "guide");
    expect(result).toEqual({ error: "You must be signed in." });
  });

  it("rejects an invalid role", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    const result = await addTeamMember("seed-1", "guide@example.com", "wizard");
    expect(result).toEqual({ error: "Invalid role." });
  });

  it("returns error when seed not found", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(undefined);

    const result = await addTeamMember(
      "nonexistent",
      "guide@example.com",
      "guide",
    );
    expect(result).toEqual({ error: "Seed not found." });
  });

  it("returns error when no account exists for that email", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(mockSeedRow() as any);
    vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

    const result = await addTeamMember("seed-1", "nobody@example.com", "guide");
    expect(result).toEqual({
      error:
        "No account found with that email — they need to sign in once first.",
    });
  });

  it("rejects a non-owner non-admin adding a co-Gardener", async () => {
    setAuthMock(auth, mockSession({ id: "other-user" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(mockSeedRow() as any);

    const result = await addTeamMember(
      "seed-1",
      "guide@example.com",
      "co_gardener",
    );
    expect(result).toEqual({
      error: "You do not have permission to manage this Sprout's team.",
    });
    expect(db.query.users.findFirst).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("lets the Gardener add a Guide", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(mockSeedRow() as any);
    vi.mocked(db.query.users.findFirst).mockResolvedValue(
      mockTargetUser() as any,
    );
    vi.mocked(db.query.seedTeamMembers.findFirst).mockResolvedValue(undefined);
    const chain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);

    const result = await addTeamMember("seed-1", "guide@example.com", "guide");

    expect(result).toEqual({ success: true });
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        seedId: "seed-1",
        userId: "target-1",
        role: "guide",
        addedBy: "user-1",
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1/team");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/sprouts");
  });

  it("rejects assigning a Steward when the session isn't Admin", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" })); // the Gardener, not an admin
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(mockSeedRow() as any);

    const result = await addTeamMember("seed-1", "gail@example.com", "steward");
    expect(result).toEqual({
      error: "Only Admins can assign a City/County Steward.",
    });
    expect(db.query.users.findFirst).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("allows an Admin to assign a Steward regardless of the target's current role", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(mockSeedRow() as any);
    vi.mocked(db.query.users.findFirst).mockResolvedValue(
      mockTargetUser({ role: "user" }) as any,
    );
    vi.mocked(db.query.seedTeamMembers.findFirst).mockResolvedValue(undefined);
    const chain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);

    const result = await addTeamMember("seed-1", "gail@example.com", "steward");

    expect(result).toEqual({ success: true });
    expect(db.update).not.toHaveBeenCalled();
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ role: "steward" }),
    );
  });

  it("rejects adding someone already on the team", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(mockSeedRow() as any);
    vi.mocked(db.query.users.findFirst).mockResolvedValue(
      mockTargetUser() as any,
    );
    vi.mocked(db.query.seedTeamMembers.findFirst).mockResolvedValue({
      id: "membership-1",
    } as any);

    const result = await addTeamMember("seed-1", "guide@example.com", "guide");
    expect(result).toEqual({ error: "This person is already on the team." });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("does not add the Gardener as a duplicate roster member", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(mockSeedRow() as any);
    vi.mocked(db.query.users.findFirst).mockResolvedValue(
      mockTargetUser({ id: "user-1" }) as any,
    );

    const result = await addTeamMember(
      "seed-1",
      "gardener@example.com",
      "co_gardener",
    );

    expect(result).toEqual({ error: "The Gardener is already on the team." });
    expect(db.query.seedTeamMembers.findFirst).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });
});

describe("removeTeamMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);
    const result = await removeTeamMember("seed-1", "target-1");
    expect(result).toEqual({ error: "You must be signed in." });
  });

  it("returns error when the membership doesn't exist", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(mockSeedRow() as any);
    vi.mocked(db.query.seedTeamMembers.findFirst).mockResolvedValue(undefined);

    const result = await removeTeamMember("seed-1", "target-1");
    expect(result).toEqual({ error: "This person isn't on the team." });
  });

  it("rejects a non-owner non-admin removing a Guide", async () => {
    setAuthMock(auth, mockSession({ id: "other-user" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(mockSeedRow() as any);
    vi.mocked(db.query.seedTeamMembers.findFirst).mockResolvedValue({
      id: "membership-1",
      role: "guide",
    } as any);

    const result = await removeTeamMember("seed-1", "target-1");
    expect(result).toEqual({
      error: "You do not have permission to manage this Sprout's team.",
    });
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("rejects a non-admin removing a Steward", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" })); // the Gardener
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(mockSeedRow() as any);
    vi.mocked(db.query.seedTeamMembers.findFirst).mockResolvedValue({
      id: "membership-1",
      role: "steward",
    } as any);

    const result = await removeTeamMember("seed-1", "target-1");
    expect(result).toEqual({
      error: "Only Admins can remove a City/County Steward.",
    });
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("allows the Gardener to remove a Guide", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(mockSeedRow() as any);
    vi.mocked(db.query.seedTeamMembers.findFirst).mockResolvedValue({
      id: "membership-1",
      role: "guide",
    } as any);
    const chain = mockDbDeleteChain();
    vi.mocked(db.delete).mockReturnValue(chain as any);

    const result = await removeTeamMember("seed-1", "target-1");

    expect(result).toEqual({ success: true });
    expect(chain.where).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1/team");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/sprouts");
  });

  it("allows an Admin to remove a Steward", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(mockSeedRow() as any);
    vi.mocked(db.query.seedTeamMembers.findFirst).mockResolvedValue({
      id: "membership-1",
      role: "steward",
    } as any);
    const chain = mockDbDeleteChain();
    vi.mocked(db.delete).mockReturnValue(chain as any);

    const result = await removeTeamMember("seed-1", "target-1");
    expect(result).toEqual({ success: true });
  });
});
