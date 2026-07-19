import { describe, expect, it, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import {
  mockSession,
  mockAdminSession,
  mockDbInsertSimpleChain,
  setAuthMock,
} from "../../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      seeds: { findFirst: vi.fn() },
      seedTeamUpdates: { findFirst: vi.fn() },
    },
    insert: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  createTeamUpdate,
  replyToTeamUpdate,
} from "@/lib/actions/team-updates";

function mockSproutSeed(overrides?: Record<string, unknown>) {
  return {
    id: "seed-1",
    createdBy: "user-1",
    status: "in_progress",
    ...overrides,
  };
}

function mockTeamUpdate(overrides?: Record<string, unknown>) {
  return {
    id: "update-1",
    seedId: "seed-1",
    parentId: null,
    seed: mockSproutSeed(),
    ...overrides,
  };
}

describe("createTeamUpdate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);
    const result = await createTeamUpdate("seed-1", { body: "Status check" });
    expect(result).toEqual({
      error: "You must be signed in to post a team update.",
    });
  });

  it("returns error when seed not found", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(undefined);

    const result = await createTeamUpdate("nonexistent", {
      body: "Status check",
    });
    expect(result).toEqual({ error: "Seed not found." });
  });

  it("rejects a user with no access to the seed", async () => {
    setAuthMock(auth, mockSession({ id: "other-user" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSproutSeed() as any,
    );

    const result = await createTeamUpdate("seed-1", { body: "Status check" });
    expect(result).toHaveProperty("error");
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("rejects when the seed is not a Sprout", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSproutSeed({ status: "approved" }) as any,
    );

    const result = await createTeamUpdate("seed-1", { body: "Status check" });
    expect(result).toEqual({
      error: "Team Updates are only available for Sprouts.",
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("validates input data", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSproutSeed() as any,
    );

    const result = await createTeamUpdate("seed-1", { body: "" });
    expect(result).toHaveProperty("error");
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("creates an update as the seed owner", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSproutSeed() as any,
    );
    const chain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);

    const result = await createTeamUpdate("seed-1", {
      title: "Site visit complete",
      body: "We got approval from Parks.",
    });

    expect(result).toEqual({ success: true });
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        seedId: "seed-1",
        userId: "user-1",
        title: "Site visit complete",
        body: "We got approval from Parks.",
      }),
    );
  });

  it("allows an admin to post on any Sprout", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSproutSeed({ createdBy: "someone-else" }) as any,
    );
    const chain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);

    const result = await createTeamUpdate("seed-1", {
      body: "Checking in — haven't heard from you in a bit!",
    });
    expect(result).toEqual({ success: true });
  });

  it("revalidates the dashboard seed page", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSproutSeed() as any,
    );
    const chain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);

    await createTeamUpdate("seed-1", { body: "Status check" });

    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/seeds/seed-1");
  });
});

describe("replyToTeamUpdate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);
    const result = await replyToTeamUpdate("update-1", { body: "On it." });
    expect(result).toEqual({ error: "You must be signed in to reply." });
  });

  it("returns error when the parent update is not found", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.seedTeamUpdates.findFirst).mockResolvedValue(undefined);

    const result = await replyToTeamUpdate("nonexistent", { body: "On it." });
    expect(result).toEqual({ error: "Update not found." });
  });

  it("rejects replying to a reply", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seedTeamUpdates.findFirst).mockResolvedValue(
      mockTeamUpdate({ parentId: "some-other-update" }) as any,
    );

    const result = await replyToTeamUpdate("update-1", { body: "On it." });
    expect(result).toEqual({
      error: "Replies to replies are not supported.",
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("rejects a user with no access to the seed", async () => {
    setAuthMock(auth, mockSession({ id: "other-user" }));
    vi.mocked(db.query.seedTeamUpdates.findFirst).mockResolvedValue(
      mockTeamUpdate() as any,
    );

    const result = await replyToTeamUpdate("update-1", { body: "On it." });
    expect(result).toHaveProperty("error");
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("rejects when the seed is no longer a Sprout", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seedTeamUpdates.findFirst).mockResolvedValue(
      mockTeamUpdate({ seed: mockSproutSeed({ status: "approved" }) }) as any,
    );

    const result = await replyToTeamUpdate("update-1", { body: "On it." });
    expect(result).toEqual({
      error: "Team Updates are only available for Sprouts.",
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("allows the owner to reply to an admin's reply", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seedTeamUpdates.findFirst).mockResolvedValue(
      mockTeamUpdate() as any,
    );
    const chain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);

    const result = await replyToTeamUpdate("update-1", {
      body: "Thanks, hoping to move this forward next week.",
    });

    expect(result).toEqual({ success: true });
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        seedId: "seed-1",
        userId: "user-1",
        parentId: "update-1",
        body: "Thanks, hoping to move this forward next week.",
      }),
    );
  });

  it("allows an admin to reply", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.seedTeamUpdates.findFirst).mockResolvedValue(
      mockTeamUpdate() as any,
    );
    const chain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);

    const result = await replyToTeamUpdate("update-1", {
      body: "I'll check with the Parks contact and report back here.",
    });
    expect(result).toEqual({ success: true });
  });

  it("revalidates the dashboard seed page", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seedTeamUpdates.findFirst).mockResolvedValue(
      mockTeamUpdate() as any,
    );
    const chain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);

    await replyToTeamUpdate("update-1", { body: "On it." });

    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/seeds/seed-1");
  });
});
