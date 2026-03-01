import { describe, expect, it, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import {
  mockSession,
  mockAdminSession,
  mockDbInsertSimpleChain,
  mockDbUpdateChain,
  mockDbDeleteChain,
} from "../../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      adminEmails: { findFirst: vi.fn() },
      users: { findFirst: vi.fn() },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { addAdminEmail, removeAdminEmail } from "@/lib/actions/admin-emails";

describe("addAdminEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(addAdminEmail("new@example.com")).rejects.toThrow(
      "Unauthorized",
    );
  });

  it("rejects non-admin users", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession({ role: "user" }));

    await expect(addAdminEmail("new@example.com")).rejects.toThrow(
      "Unauthorized",
    );
  });

  it("returns error for invalid email", async () => {
    vi.mocked(auth).mockResolvedValue(mockAdminSession());

    const result = await addAdminEmail("not-an-email");

    expect(result).toEqual({ error: "Invalid email address" });
  });

  it("returns error for empty email", async () => {
    vi.mocked(auth).mockResolvedValue(mockAdminSession());

    const result = await addAdminEmail("   ");

    expect(result).toEqual({ error: "Invalid email address" });
  });

  it("returns error if email already exists in admin list", async () => {
    vi.mocked(auth).mockResolvedValue(mockAdminSession());
    vi.mocked(db.query.adminEmails.findFirst).mockResolvedValue({
      id: "existing-id",
    } as any);

    const result = await addAdminEmail("existing@example.com");

    expect(result).toEqual({ error: "Email is already in the admin list" });
  });

  it("inserts email and revalidates on success", async () => {
    vi.mocked(auth).mockResolvedValue(mockAdminSession());
    vi.mocked(db.query.adminEmails.findFirst).mockResolvedValue(undefined);
    vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);
    const insertChain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(insertChain as any);

    const result = await addAdminEmail("New@Example.com");

    expect(result).toEqual({ success: true });
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(insertChain.values).toHaveBeenCalledWith({
      email: "new@example.com",
      addedBy: "admin-1",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("promotes existing user to admin", async () => {
    vi.mocked(auth).mockResolvedValue(mockAdminSession());
    vi.mocked(db.query.adminEmails.findFirst).mockResolvedValue(undefined);
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      id: "user-99",
      role: "user",
    } as any);
    const insertChain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(insertChain as any);
    const updateChain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(updateChain as any);

    const result = await addAdminEmail("existing-user@example.com");

    expect(result).toEqual({ success: true });
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(updateChain.set).toHaveBeenCalledWith({ role: "admin" });
  });

  it("does not promote user already admin", async () => {
    vi.mocked(auth).mockResolvedValue(mockAdminSession());
    vi.mocked(db.query.adminEmails.findFirst).mockResolvedValue(undefined);
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      id: "user-99",
      role: "admin",
    } as any);
    const insertChain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(insertChain as any);

    await addAdminEmail("already-admin@example.com");

    expect(db.update).not.toHaveBeenCalled();
  });
});

describe("removeAdminEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(removeAdminEmail("id-1")).rejects.toThrow("Unauthorized");
  });

  it("rejects non-admin users", async () => {
    vi.mocked(auth).mockResolvedValue(mockSession({ role: "user" }));

    await expect(removeAdminEmail("id-1")).rejects.toThrow("Unauthorized");
  });

  it("returns error if admin email not found", async () => {
    vi.mocked(auth).mockResolvedValue(mockAdminSession());
    vi.mocked(db.query.adminEmails.findFirst).mockResolvedValue(undefined);

    const result = await removeAdminEmail("nonexistent-id");

    expect(result).toEqual({ error: "Admin email not found" });
  });

  it("deletes email and demotes user not in env var", async () => {
    vi.mocked(auth).mockResolvedValue(mockAdminSession());
    vi.mocked(db.query.adminEmails.findFirst).mockResolvedValue({
      email: "demote@example.com",
    } as any);
    const deleteChain = mockDbDeleteChain();
    vi.mocked(db.delete).mockReturnValue(deleteChain as any);
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      id: "user-99",
    } as any);
    const updateChain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(updateChain as any);

    const result = await removeAdminEmail("id-1");

    expect(result).toEqual({ success: true });
    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(updateChain.set).toHaveBeenCalledWith({ role: "user" });
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("does not demote user if email is in env var", async () => {
    vi.mocked(auth).mockResolvedValue(mockAdminSession());

    const originalEnv = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "protected@example.com";

    vi.mocked(db.query.adminEmails.findFirst).mockResolvedValue({
      email: "protected@example.com",
    } as any);
    const deleteChain = mockDbDeleteChain();
    vi.mocked(db.delete).mockReturnValue(deleteChain as any);

    const result = await removeAdminEmail("id-1");

    expect(result).toEqual({ success: true });
    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(db.update).not.toHaveBeenCalled();

    process.env.ADMIN_EMAILS = originalEnv;
  });
});
