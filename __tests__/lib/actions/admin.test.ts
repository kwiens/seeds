import { describe, expect, it, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import {
  mockSession,
  mockAdminSession,
  mockDbUpdateChain,
  mockDbInsertSimpleChain,
  mockDbInsertOnConflictChain,
  setAuthMock,
} from "../../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    update: vi.fn(),
    insert: vi.fn(),
    batch: vi.fn(),
    query: { seeds: { findFirst: vi.fn() } },
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  approveSeed,
  archiveSeed,
  setBannerConfig,
  unapproveSeed,
  unarchiveSeed,
} from "@/lib/actions/admin";

describe("approveSeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    setAuthMock(auth, null);

    await expect(approveSeed("seed-1")).rejects.toThrow("Unauthorized");
  });

  it("rejects non-admin users", async () => {
    setAuthMock(auth, mockSession({ role: "user" }));

    await expect(approveSeed("seed-1")).rejects.toThrow("Unauthorized");
  });

  it("approves seed and creates approval record via batch", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.batch).mockResolvedValue([] as any);
    const updateChain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(updateChain as any);
    const insertChain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(insertChain as any);

    const result = await approveSeed("seed-1");

    expect(result).toEqual({ success: true });
    expect(db.batch).toHaveBeenCalledTimes(1);
  });

  it("revalidates correct paths", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.batch).mockResolvedValue([] as any);
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
    setAuthMock(auth, null);

    await expect(archiveSeed("seed-1")).rejects.toThrow("Unauthorized");
  });

  it("rejects non-admin users", async () => {
    setAuthMock(auth, mockSession({ role: "user" }));

    await expect(archiveSeed("seed-1")).rejects.toThrow("Unauthorized");
  });

  it("archives a pending seed by setting status", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue({
      status: "pending",
    } as any);
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await archiveSeed("seed-1");

    expect(result).toEqual({ success: true });
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "archived" }),
    );
  });

  it("archives an approved seed", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue({
      status: "approved",
    } as any);
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await archiveSeed("seed-1");

    expect(result).toEqual({ success: true });
  });

  it("refuses to archive a sprout (in_progress) to avoid lossy unarchive", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue({
      status: "in_progress",
    } as any);

    await expect(archiveSeed("seed-1")).rejects.toThrow(
      /reverted to Seed before archiving/,
    );
    expect(db.update).not.toHaveBeenCalled();
  });

  it("refuses to archive a tree (in_maintenance)", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue({
      status: "in_maintenance",
    } as any);

    await expect(archiveSeed("seed-1")).rejects.toThrow(
      /reverted to Seed before archiving/,
    );
    expect(db.update).not.toHaveBeenCalled();
  });

  it("revalidates correct paths including status listings", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.seeds.findFirst).mockResolvedValue({
      status: "approved",
    } as any);
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    await archiveSeed("seed-1");

    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1");
    expect(revalidatePath).toHaveBeenCalledWith("/status/seeds");
    expect(revalidatePath).toHaveBeenCalledWith("/status/sprouts");
    expect(revalidatePath).toHaveBeenCalledWith("/status/trees");
  });
});

describe("unarchiveSeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    setAuthMock(auth, null);

    await expect(unarchiveSeed("seed-1")).rejects.toThrow("Unauthorized");
  });

  it("rejects non-admin users", async () => {
    setAuthMock(auth, mockSession({ role: "user" }));

    await expect(unarchiveSeed("seed-1")).rejects.toThrow("Unauthorized");
  });

  it("sets status to pending", async () => {
    setAuthMock(auth, mockAdminSession());
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await unarchiveSeed("seed-1");

    expect(result).toEqual({ success: true });
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending" }),
    );
  });

  it("revalidates correct paths", async () => {
    setAuthMock(auth, mockAdminSession());
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    await unarchiveSeed("seed-1");

    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/status/seeds");
  });
});

describe("unapproveSeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    setAuthMock(auth, null);

    await expect(unapproveSeed("seed-1")).rejects.toThrow("Unauthorized");
  });

  it("rejects non-admin users", async () => {
    setAuthMock(auth, mockSession({ role: "user" }));

    await expect(unapproveSeed("seed-1")).rejects.toThrow("Unauthorized");
  });

  it("sets status to pending", async () => {
    setAuthMock(auth, mockAdminSession());
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await unapproveSeed("seed-1");

    expect(result).toEqual({ success: true });
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending" }),
    );
  });

  it("revalidates correct paths", async () => {
    setAuthMock(auth, mockAdminSession());
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    await unapproveSeed("seed-1");

    expect(revalidatePath).toHaveBeenCalledWith("/admin");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1");
  });
});

describe("setBannerConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    setAuthMock(auth, null);

    await expect(
      setBannerConfig({ enabled: true, message: "Hi", href: "" }),
    ).rejects.toThrow("Unauthorized");
  });

  it("rejects non-admin users", async () => {
    setAuthMock(auth, mockSession({ role: "user" }));

    await expect(
      setBannerConfig({ enabled: true, message: "Hi", href: "" }),
    ).rejects.toThrow("Unauthorized");
  });

  it("accepts a valid config", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.insert).mockReturnValue(mockDbInsertOnConflictChain() as any);

    const result = await setBannerConfig({
      enabled: true,
      message: "Join us tonight",
      href: "https://example.com",
    });

    expect(result).toEqual({ success: true });
  });

  it("rejects non-https hrefs", async () => {
    setAuthMock(auth, mockAdminSession());

    const result = await setBannerConfig({
      enabled: true,
      message: "Hi",
      href: "javascript:alert(1)",
    });

    expect(result).toEqual({ success: false, error: expect.any(String) });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("rejects http:// hrefs", async () => {
    setAuthMock(auth, mockAdminSession());

    const result = await setBannerConfig({
      enabled: true,
      message: "Hi",
      href: "http://example.com",
    });

    expect(result).toEqual({ success: false, error: expect.any(String) });
  });

  it("rejects malformed URLs", async () => {
    setAuthMock(auth, mockAdminSession());

    const result = await setBannerConfig({
      enabled: true,
      message: "Hi",
      href: "https://",
    });

    expect(result).toEqual({ success: false, error: expect.any(String) });
  });

  it("rejects over-length messages", async () => {
    setAuthMock(auth, mockAdminSession());

    const result = await setBannerConfig({
      enabled: true,
      message: "x".repeat(201),
      href: "",
    });

    expect(result).toEqual({ success: false, error: expect.any(String) });
  });

  it("accepts an empty href", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.insert).mockReturnValue(mockDbInsertOnConflictChain() as any);

    const result = await setBannerConfig({
      enabled: false,
      message: "",
      href: "",
    });

    expect(result).toEqual({ success: true });
  });

  it("rejects enabled=true with an empty message", async () => {
    setAuthMock(auth, mockAdminSession());

    const result = await setBannerConfig({
      enabled: true,
      message: "",
      href: "",
    });

    expect(result).toEqual({ success: false, error: expect.any(String) });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("rejects enabled=true with a whitespace-only message", async () => {
    setAuthMock(auth, mockAdminSession());

    const result = await setBannerConfig({
      enabled: true,
      message: "   ",
      href: "",
    });

    expect(result).toEqual({ success: false, error: expect.any(String) });
  });
});
