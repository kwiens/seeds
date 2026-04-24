import { describe, expect, it, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import {
  mockSession,
  mockDbInsertSimpleChain,
  mockDbDeleteChain,
  setAuthMock,
} from "../../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    query: { seedSupports: { findFirst: vi.fn() } },
    insert: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { toggleSupport } from "@/lib/actions/support";

// Chains the autoPromoteIfEligible update path: db.update().set().where().returning()
function mockAutoPromoteChain(promoted: boolean) {
  const mockReturning = vi
    .fn()
    .mockResolvedValue(promoted ? [{ id: "seed-1" }] : []);
  const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
  return { set: mockSet };
}

describe("toggleSupport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);

    const result = await toggleSupport("seed-1");
    expect(result).toEqual({
      error: "You must be signed in to support a seed.",
    });
  });

  it("adds support when not already supporting", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seedSupports.findFirst).mockResolvedValue(undefined);
    const chain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);
    vi.mocked(db.update).mockReturnValue(mockAutoPromoteChain(false) as any);

    const result = await toggleSupport("seed-1");

    expect(result).toEqual({ success: true });
    expect(db.insert).toHaveBeenCalled();
    expect(chain.values).toHaveBeenCalledWith({
      seedId: "seed-1",
      userId: "user-1",
    });
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("removes support when already supporting", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seedSupports.findFirst).mockResolvedValue({
      id: "support-1",
      seedId: "seed-1",
      userId: "user-1",
      createdAt: new Date(),
    });
    const chain = mockDbDeleteChain();
    vi.mocked(db.delete).mockReturnValue(chain as any);

    const result = await toggleSupport("seed-1");

    expect(result).toEqual({ success: true });
    expect(db.delete).toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("revalidates correct paths", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.seedSupports.findFirst).mockResolvedValue(undefined);
    const chain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);
    vi.mocked(db.update).mockReturnValue(mockAutoPromoteChain(false) as any);

    await toggleSupport("seed-1");

    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("uses session user id, not client-supplied value", async () => {
    setAuthMock(auth, mockSession({ id: "real-user-id" }));
    vi.mocked(db.query.seedSupports.findFirst).mockResolvedValue(undefined);
    const chain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);
    vi.mocked(db.update).mockReturnValue(mockAutoPromoteChain(false) as any);

    await toggleSupport("seed-1");

    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "real-user-id" }),
    );
  });

  it("attempts auto-promote after adding a new support", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seedSupports.findFirst).mockResolvedValue(undefined);
    vi.mocked(db.insert).mockReturnValue(mockDbInsertSimpleChain() as any);
    vi.mocked(db.update).mockReturnValue(mockAutoPromoteChain(false) as any);

    await toggleSupport("seed-1");

    expect(db.update).toHaveBeenCalled();
  });

  it("does not attempt auto-promote on unsupport", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seedSupports.findFirst).mockResolvedValue({
      id: "support-1",
      seedId: "seed-1",
      userId: "user-1",
      createdAt: new Date(),
    });
    vi.mocked(db.delete).mockReturnValue(mockDbDeleteChain() as any);

    await toggleSupport("seed-1");

    expect(db.update).not.toHaveBeenCalled();
  });

  it("revalidates admin and status pages when promotion fires", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seedSupports.findFirst).mockResolvedValue(undefined);
    vi.mocked(db.insert).mockReturnValue(mockDbInsertSimpleChain() as any);
    vi.mocked(db.update).mockReturnValue(mockAutoPromoteChain(true) as any);

    await toggleSupport("seed-1");

    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(revalidatePath).toHaveBeenCalledWith("/status/seeds");
  });

  it("does not revalidate admin/status pages when promotion does not fire", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seedSupports.findFirst).mockResolvedValue(undefined);
    vi.mocked(db.insert).mockReturnValue(mockDbInsertSimpleChain() as any);
    vi.mocked(db.update).mockReturnValue(mockAutoPromoteChain(false) as any);

    await toggleSupport("seed-1");

    const calls = vi.mocked(revalidatePath).mock.calls.map(([p]) => p);
    expect(calls).not.toContain("/admin");
    expect(calls).not.toContain("/status/seeds");
  });
});
