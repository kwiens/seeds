import { describe, expect, it, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  mockSession,
  mockAdminSession,
  mockSeed,
  validSeedFormData,
  mockDbInsertChain,
  mockDbUpdateChain,
  setAuthMock,
} from "../../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    query: { seeds: { findFirst: vi.fn() } },
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createSeed, updateSeed } from "@/lib/actions/seeds";

describe("createSeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);

    const result = await createSeed(validSeedFormData());
    expect(result).toEqual({ error: "You must be signed in to plant a seed." });
  });

  it("validates input data", async () => {
    setAuthMock(auth, mockSession());

    const result = await createSeed({ name: "", summary: "", category: "bad" });
    expect(result).toHaveProperty("error");
  });

  it("rejects missing required fields", async () => {
    setAuthMock(auth, mockSession());

    const result = await createSeed({});
    expect(result).toHaveProperty("error");
  });

  it("creates seed and redirects on success", async () => {
    setAuthMock(auth, mockSession());
    const chain = mockDbInsertChain([{ id: "new-seed-id" }]);
    vi.mocked(db.insert).mockReturnValue(chain as any);

    await expect(createSeed(validSeedFormData())).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(db.insert).toHaveBeenCalled();
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Community Garden",
        status: "pending",
        createdBy: "user-1",
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(redirect).toHaveBeenCalledWith("/seeds/new-seed-id");
  });

  it("sets status to pending on creation", async () => {
    setAuthMock(auth, mockSession());
    const chain = mockDbInsertChain([{ id: "seed-1" }]);
    vi.mocked(db.insert).mockReturnValue(chain as any);

    await expect(createSeed(validSeedFormData())).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending" }),
    );
  });

  it("uses the authenticated user's id as createdBy", async () => {
    setAuthMock(auth, mockSession({ id: "my-user-id" }));
    const chain = mockDbInsertChain([{ id: "seed-1" }]);
    vi.mocked(db.insert).mockReturnValue(chain as any);

    await expect(createSeed(validSeedFormData())).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ createdBy: "my-user-id" }),
    );
  });

  it("handles optional location fields", async () => {
    setAuthMock(auth, mockSession());
    const chain = mockDbInsertChain([{ id: "seed-1" }]);
    vi.mocked(db.insert).mockReturnValue(chain as any);

    const data = validSeedFormData({
      locationAddress: "123 Main St",
      locationLat: 35.0456,
      locationLng: -85.3097,
    });

    await expect(createSeed(data)).rejects.toThrow("NEXT_REDIRECT");

    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        locationAddress: "123 Main St",
        locationLat: 35.0456,
        locationLng: -85.3097,
      }),
    );
  });

  it("nullifies missing location fields", async () => {
    setAuthMock(auth, mockSession());
    const chain = mockDbInsertChain([{ id: "seed-1" }]);
    vi.mocked(db.insert).mockReturnValue(chain as any);

    await expect(createSeed(validSeedFormData())).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        locationAddress: null,
        locationLat: null,
        locationLng: null,
      }),
    );
  });
});

describe("updateSeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);

    const result = await updateSeed("seed-1", validSeedFormData());
    expect(result).toEqual({ error: "You must be signed in." });
  });

  it("returns error when seed not found", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(undefined);

    const result = await updateSeed("nonexistent", validSeedFormData());
    expect(result).toEqual({ error: "Seed not found." });
  });

  it("rejects edit by non-owner non-admin", async () => {
    setAuthMock(auth, mockSession({ id: "other-user" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSeed({ createdBy: "user-1" }) as any,
    );

    const result = await updateSeed("seed-1", validSeedFormData());
    expect(result).toEqual({
      error: "You don't have permission to edit this seed.",
    });
  });

  it("allows owner to edit", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSeed({ createdBy: "user-1" }) as any,
    );
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    await expect(
      updateSeed("seed-1", validSeedFormData({ name: "Updated Garden" })),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Updated Garden" }),
    );
    expect(redirect).toHaveBeenCalledWith("/seeds/seed-1");
  });

  it("allows admin to edit any seed", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSeed({ createdBy: "someone-else" }) as any,
    );
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    await expect(updateSeed("seed-1", validSeedFormData())).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(db.update).toHaveBeenCalled();
  });

  it("validates input before updating", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSeed({ createdBy: "user-1" }) as any,
    );

    const result = await updateSeed("seed-1", { name: "", summary: "" });
    expect(result).toHaveProperty("error");
    expect(db.update).not.toHaveBeenCalled();
  });

  it("revalidates correct paths on success", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(
      mockSeed({ createdBy: "user-1" }) as any,
    );
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    await expect(updateSeed("seed-1", validSeedFormData())).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });
});
