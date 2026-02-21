import { describe, expect, it, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import {
  mockSession,
  mockAdminSession,
  mockDbUpdateChain,
  mockDbInsertSimpleChain,
} from "../../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    update: vi.fn(),
    insert: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  approveSeed,
  archiveSeed,
  unapproveSeed,
  unarchiveSeed,
} from "@/lib/actions/admin";

describe("approveSeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(approveSeed("seed-1")).rejects.toThrow("Unauthorized");
  });

  it("rejects non-admin users", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession({ role: "user" }));

    await expect(approveSeed("seed-1")).rejects.toThrow("Unauthorized");
  });

  it("approves seed and creates approval record", async () => {
    vi.mocked(auth).mockResolvedValue(mockAdminSession());
    const updateChain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(updateChain as any);
    const insertChain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(insertChain as any);

    const result = await approveSeed("seed-1");

    expect(result).toEqual({ success: true });
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "approved" }),
    );
    expect(insertChain.values).toHaveBeenCalledWith({
      seedId: "seed-1",
      approvedBy: "admin-1",
    });
  });

  it("revalidates correct paths", async () => {
    vi.mocked(auth).mockResolvedValue(mockAdminSession());
    const updateChain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(updateChain as any);
    const insertChain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(insertChain as any);

    await approveSeed("seed-1");

    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1");
  });
});

describe("archiveSeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(archiveSeed("seed-1")).rejects.toThrow("Unauthorized");
  });

  it("rejects non-admin users", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession({ role: "user" }));

    await expect(archiveSeed("seed-1")).rejects.toThrow("Unauthorized");
  });

  it("archives seed by setting status", async () => {
    vi.mocked(auth).mockResolvedValue(mockAdminSession());
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await archiveSeed("seed-1");

    expect(result).toEqual({ success: true });
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "archived" }),
    );
  });

  it("revalidates correct paths", async () => {
    vi.mocked(auth).mockResolvedValue(mockAdminSession());
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    await archiveSeed("seed-1");

    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });
});

describe("unarchiveSeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(unarchiveSeed("seed-1")).rejects.toThrow("Unauthorized");
  });

  it("rejects non-admin users", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession({ role: "user" }));

    await expect(unarchiveSeed("seed-1")).rejects.toThrow("Unauthorized");
  });

  it("sets status to pending", async () => {
    vi.mocked(auth).mockResolvedValue(mockAdminSession());
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await unarchiveSeed("seed-1");

    expect(result).toEqual({ success: true });
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending" }),
    );
  });

  it("revalidates correct paths", async () => {
    vi.mocked(auth).mockResolvedValue(mockAdminSession());
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    await unarchiveSeed("seed-1");

    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });
});

describe("unapproveSeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(unapproveSeed("seed-1")).rejects.toThrow("Unauthorized");
  });

  it("rejects non-admin users", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession({ role: "user" }));

    await expect(unapproveSeed("seed-1")).rejects.toThrow("Unauthorized");
  });

  it("sets status to pending", async () => {
    vi.mocked(auth).mockResolvedValue(mockAdminSession());
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await unapproveSeed("seed-1");

    expect(result).toEqual({ success: true });
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending" }),
    );
  });

  it("revalidates correct paths", async () => {
    vi.mocked(auth).mockResolvedValue(mockAdminSession());
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    await unapproveSeed("seed-1");

    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1");
  });
});
