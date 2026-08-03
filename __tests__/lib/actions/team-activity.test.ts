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
      projects: { findFirst: vi.fn() },
      projectParticipants: { findFirst: vi.fn() },
    },
    insert: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { markProjectActivityRead } from "@/lib/actions/team-activity";

function mockSproutSeed(overrides?: Record<string, unknown>) {
  return {
    id: "seed-1",
    createdBy: "user-1",
    stage: "sprout",
    ...overrides,
  };
}

describe("markProjectActivityRead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing when signed out", async () => {
    setAuthMock(auth, null);

    await markProjectActivityRead("seed-1", new Date().toISOString());

    expect(db.insert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("does nothing when the seed does not exist", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(undefined);

    await markProjectActivityRead("nonexistent", new Date().toISOString());

    expect(db.insert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("does nothing when the caller has no team access to the seed", async () => {
    setAuthMock(auth, mockSession({ id: "other-user" }));
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSproutSeed() as any,
    );
    vi.mocked(db.query.projectParticipants.findFirst).mockResolvedValue(
      undefined,
    );

    await markProjectActivityRead("seed-1", new Date().toISOString());

    expect(db.insert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("upserts the read marker without revalidating the active workspace", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSproutSeed() as any,
    );
    vi.mocked(db.query.projectParticipants.findFirst).mockResolvedValue({
      id: "participant-1",
    } as any);
    const chain = mockDbInsertOnConflictChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);
    const readThrough = "2026-07-26T20:00:00.000Z";

    await markProjectActivityRead("seed-1", readThrough);

    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "seed-1",
        userId: "user-1",
        lastReadAt: new Date(readThrough),
      }),
    );
    expect(chain._onConflictDoUpdate).toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("does not write a marker for someone without Team access", async () => {
    setAuthMock(auth, mockSession({ id: "other-user" }));
    vi.mocked(db.query.projects.findFirst).mockResolvedValue({
      id: "seed-1",
      createdBy: "user-1",
      stage: "sprout",
    } as any);
    vi.mocked(db.query.projectParticipants.findFirst).mockResolvedValue(
      undefined,
    );

    await markProjectActivityRead("seed-1", new Date().toISOString());

    expect(db.insert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("does not write a marker before a Seed becomes a Sprout", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projects.findFirst).mockResolvedValue({
      id: "seed-1",
      createdBy: "user-1",
      stage: "seed",
    } as any);

    await markProjectActivityRead("seed-1", new Date().toISOString());

    expect(db.insert).not.toHaveBeenCalled();
  });
});
