import { describe, expect, it, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import {
  mockSession,
  mockAdminSession,
  mockDbInsertChain,
  mockDbUpdateChain,
  mockDbDeleteChain,
  setAuthMock,
} from "../../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      seeds: { findFirst: vi.fn() },
      seedUpdates: { findFirst: vi.fn() },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createUpdate, editUpdate, deleteUpdate } from "@/lib/actions/updates";

const validBody = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Great progress!" }] },
  ],
};
const validUpdateData = { title: "Progress Update", body: validBody };

function mockUpdate(overrides?: Record<string, unknown>) {
  return {
    id: "update-1",
    seedId: "seed-1",
    title: "Old Title",
    body: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Old body" }] },
      ],
    },
    createdBy: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    seed: { id: "seed-1", createdBy: "user-1" },
    ...overrides,
  };
}

describe("createUpdate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);
    const result = await createUpdate("seed-1", validUpdateData);
    expect(result).toEqual({
      error: "You must be signed in to post an update.",
    });
  });

  it("returns error when seed not found", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue(undefined);

    const result = await createUpdate("nonexistent", validUpdateData);
    expect(result).toEqual({ error: "Seed not found." });
  });

  it("rejects non-owner non-admin", async () => {
    setAuthMock(auth, mockSession({ id: "other-user" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue({
      id: "seed-1",
      createdBy: "user-1",
    } as any);

    const result = await createUpdate("seed-1", validUpdateData);
    expect(result).toHaveProperty("error");
  });

  it("validates input data", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue({
      id: "seed-1",
      createdBy: "user-1",
    } as any);

    const result = await createUpdate("seed-1", { title: "", body: "" });
    expect(result).toHaveProperty("error");
  });

  it("creates update on success", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue({
      id: "seed-1",
      createdBy: "user-1",
    } as any);
    const chain = mockDbInsertChain([{ id: "update-1" }]);
    vi.mocked(db.insert).mockReturnValue(chain as any);

    const result = await createUpdate("seed-1", validUpdateData);

    expect(result).toEqual({ success: true, updateId: "update-1" });
    expect(db.insert).toHaveBeenCalled();
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        seedId: "seed-1",
        title: "Progress Update",
        body: validBody,
        createdBy: "user-1",
      }),
    );
  });

  it("allows admin to create update for any seed", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue({
      id: "seed-1",
      createdBy: "someone-else",
    } as any);
    const chain = mockDbInsertChain([{ id: "update-1" }]);
    vi.mocked(db.insert).mockReturnValue(chain as any);

    const result = await createUpdate("seed-1", validUpdateData);
    expect(result).toEqual({ success: true, updateId: "update-1" });
  });

  it("revalidates correct paths", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue({
      id: "seed-1",
      createdBy: "user-1",
    } as any);
    const chain = mockDbInsertChain([{ id: "update-1" }]);
    vi.mocked(db.insert).mockReturnValue(chain as any);

    await createUpdate("seed-1", validUpdateData);

    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1");
    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1/updates");
  });
});

describe("editUpdate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);
    const result = await editUpdate("update-1", validUpdateData);
    expect(result).toEqual({ error: "You must be signed in." });
  });

  it("returns error when update not found", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.seedUpdates.findFirst).mockResolvedValue(undefined);

    const result = await editUpdate("nonexistent", validUpdateData);
    expect(result).toEqual({ error: "Update not found." });
  });

  it("rejects non-owner non-admin", async () => {
    setAuthMock(auth, mockSession({ id: "other-user" }));
    vi.mocked(db.query.seedUpdates.findFirst).mockResolvedValue(
      mockUpdate() as any,
    );

    const result = await editUpdate("update-1", validUpdateData);
    expect(result).toHaveProperty("error");
  });

  it("validates input data", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seedUpdates.findFirst).mockResolvedValue(
      mockUpdate() as any,
    );

    const result = await editUpdate("update-1", { title: "", body: "" });
    expect(result).toHaveProperty("error");
    expect(db.update).not.toHaveBeenCalled();
  });

  it("updates on success", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seedUpdates.findFirst).mockResolvedValue(
      mockUpdate() as any,
    );
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const newBody = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "New body" }] },
      ],
    };
    const result = await editUpdate("update-1", {
      title: "New Title",
      body: newBody,
    });

    expect(result).toEqual({ success: true });
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ title: "New Title", body: newBody }),
    );
  });

  it("allows admin to edit any update", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.seedUpdates.findFirst).mockResolvedValue(
      mockUpdate() as any,
    );
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await editUpdate("update-1", validUpdateData);
    expect(result).toEqual({ success: true });
  });

  it("revalidates correct paths", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seedUpdates.findFirst).mockResolvedValue(
      mockUpdate() as any,
    );
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    await editUpdate("update-1", validUpdateData);

    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1");
    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1/updates");
    expect(revalidatePath).toHaveBeenCalledWith(
      "/seeds/seed-1/updates/update-1",
    );
  });
});

describe("deleteUpdate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);
    const result = await deleteUpdate("update-1");
    expect(result).toEqual({ error: "You must be signed in." });
  });

  it("returns error when update not found", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.seedUpdates.findFirst).mockResolvedValue(undefined);

    const result = await deleteUpdate("nonexistent");
    expect(result).toEqual({ error: "Update not found." });
  });

  it("rejects non-owner non-admin", async () => {
    setAuthMock(auth, mockSession({ id: "other-user" }));
    vi.mocked(db.query.seedUpdates.findFirst).mockResolvedValue(
      mockUpdate() as any,
    );

    const result = await deleteUpdate("update-1");
    expect(result).toHaveProperty("error");
  });

  it("deletes on success", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seedUpdates.findFirst).mockResolvedValue(
      mockUpdate() as any,
    );
    const chain = mockDbDeleteChain();
    vi.mocked(db.delete).mockReturnValue(chain as any);

    const result = await deleteUpdate("update-1");

    expect(result).toEqual({ success: true });
    expect(db.delete).toHaveBeenCalled();
  });

  it("allows admin to delete any update", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.seedUpdates.findFirst).mockResolvedValue(
      mockUpdate() as any,
    );
    const chain = mockDbDeleteChain();
    vi.mocked(db.delete).mockReturnValue(chain as any);

    const result = await deleteUpdate("update-1");
    expect(result).toEqual({ success: true });
  });

  it("revalidates correct paths", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.seedUpdates.findFirst).mockResolvedValue(
      mockUpdate() as any,
    );
    const chain = mockDbDeleteChain();
    vi.mocked(db.delete).mockReturnValue(chain as any);

    await deleteUpdate("update-1");

    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1");
    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1/updates");
  });
});
