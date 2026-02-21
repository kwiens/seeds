import { describe, expect, it, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import {
  mockSession,
  mockDbInsertSimpleChain,
  mockDbDeleteChain,
} from "../../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    query: { seedSupports: { findFirst: vi.fn() } },
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { toggleSupport } from "@/lib/actions/support";

describe("toggleSupport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    const result = await toggleSupport("seed-1");
    expect(result).toEqual({
      error: "You must be signed in to support a seed.",
    });
  });

  it("adds support when not already supporting", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession({ id: "user-1" }));
    vi.mocked(db.query.seedSupports.findFirst).mockResolvedValue(undefined);
    const chain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);

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
    vi.mocked(auth).mockResolvedValue(mockSession({ id: "user-1" }));
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
    vi.mocked(auth).mockResolvedValue(mockSession());
    vi.mocked(db.query.seedSupports.findFirst).mockResolvedValue(undefined);
    const chain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);

    await toggleSupport("seed-1");

    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("uses session user id, not client-supplied value", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession({ id: "real-user-id" }));
    vi.mocked(db.query.seedSupports.findFirst).mockResolvedValue(undefined);
    const chain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);

    await toggleSupport("seed-1");

    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "real-user-id" }),
    );
  });
});
