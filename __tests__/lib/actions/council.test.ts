import { describe, expect, it, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import {
  mockSession,
  mockAdminSession,
  mockDbUpdateChain,
  setAuthMock,
} from "../../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      users: { findFirst: vi.fn() },
    },
    update: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { demoteFromCouncil, promoteToCouncil } from "@/lib/actions/council";

describe("promoteToCouncil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    setAuthMock(auth, null);
    await expect(promoteToCouncil("new@example.com")).rejects.toThrow(
      "Unauthorized",
    );
  });

  it("rejects non-admin users", async () => {
    setAuthMock(auth, mockSession({ role: "user" }));
    await expect(promoteToCouncil("new@example.com")).rejects.toThrow(
      "Unauthorized",
    );
  });

  it("returns error when no account exists for that email", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);

    const result = await promoteToCouncil("nobody@example.com");

    expect(result).toEqual({
      error:
        "No account found with that email — they need to sign in once first.",
    });
  });

  it("returns error if the target is already an admin", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      id: "user-2",
      role: "admin",
    } as any);

    const result = await promoteToCouncil("kyle@example.com");

    expect(result).toEqual({ error: "This person is already an Admin." });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("returns error if the target is already on the Council", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      id: "user-2",
      role: "council",
    } as any);

    const result = await promoteToCouncil("gail@example.com");

    expect(result).toEqual({
      error: "This person is already on the Council.",
    });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("promotes an existing regular user to council", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      id: "user-2",
      role: "user",
    } as any);
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await promoteToCouncil("gail@example.com");

    expect(result).toEqual({ success: true });
    expect(chain.set).toHaveBeenCalledWith({ role: "council" });
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });
});

describe("demoteFromCouncil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    setAuthMock(auth, null);
    await expect(demoteFromCouncil("user-2")).rejects.toThrow("Unauthorized");
  });

  it("rejects non-admin users", async () => {
    setAuthMock(auth, mockSession({ role: "user" }));
    await expect(demoteFromCouncil("user-2")).rejects.toThrow("Unauthorized");
  });

  it("demotes the user back to a regular role", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      role: "council",
    } as any);
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await demoteFromCouncil("user-2");

    expect(result).toEqual({ success: true });
    expect(chain.set).toHaveBeenCalledWith({ role: "user" });
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("does not demote an Admin when given a forged user id", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.users.findFirst).mockResolvedValue({
      role: "admin",
    } as any);

    const result = await demoteFromCouncil("admin-2");

    expect(result).toEqual({ error: "This person is not on the Council." });
    expect(db.update).not.toHaveBeenCalled();
  });
});
