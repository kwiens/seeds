import { describe, expect, it, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import {
  mockSession,
  mockDbInsertOnConflictChain,
  setAuthMock,
} from "../../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      seeds: { findFirst: vi.fn() },
      seedTeamMembers: { findFirst: vi.fn() },
    },
    insert: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { markSproutActivityRead } from "@/lib/actions/team-activity";

function mockSproutSeed(overrides?: Record<string, unknown>) {
  return {
    id: "seed-1",
    createdBy: "user-1",
    ...overrides,
  };
}

describe("markSproutActivityRead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when signed out", async () => {
    setAuthMock(auth, null);

    await markSproutActivityRead("seed-1", new Date().toISOString());

    expect(db.insert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("does nothing when the seed does not exist", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(undefined);

    await markSproutActivityRead("nonexistent", new Date().toISOString());

    expect(db.insert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("does nothing when the caller has no team access to the seed", async () => {
    setAuthMock(auth, mockSession({ id: "other-user" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSproutSeed() as any,
    );
    vi.mocked(db.query.seedTeamMembers.findFirst).mockResolvedValue(undefined);

    await markSproutActivityRead("seed-1", new Date().toISOString());

    expect(db.insert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("upserts the read marker and revalidates", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSproutSeed() as any,
    );
    const chain = mockDbInsertOnConflictChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);
    const readThrough = "2026-07-26T20:00:00.000Z";

    await markSproutActivityRead("seed-1", readThrough);

    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        seedId: "seed-1",
        userId: "user-1",
        lastReadAt: new Date(readThrough),
      }),
    );
    expect(chain._onConflictDoUpdate).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/sprouts");
  });

  it("does not write a marker for someone without Team access", async () => {
    setAuthMock(auth, mockSession({ id: "other-user" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue({
      id: "seed-1",
      createdBy: "user-1",
    } as any);
    vi.mocked(db.query.seedTeamMembers.findFirst).mockResolvedValue(undefined);

    await markSproutActivityRead("seed-1", new Date().toISOString());

    expect(db.insert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
