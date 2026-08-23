import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: { select: vi.fn() },
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    desc: vi.fn(actual.desc),
    ilike: vi.fn(actual.ilike),
  };
});

import { desc, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { getUsersPage, USERS_PER_PAGE } from "@/lib/db/queries/admin";
import { users } from "@/lib/db/schema";

function mockUserPage(rows: unknown[], totalCount: number) {
  const rowsChain: Record<string, ReturnType<typeof vi.fn>> = {};
  rowsChain.from = vi.fn().mockReturnValue(rowsChain);
  rowsChain.where = vi.fn().mockReturnValue(rowsChain);
  rowsChain.orderBy = vi.fn().mockReturnValue(rowsChain);
  rowsChain.limit = vi.fn().mockReturnValue(rowsChain);
  rowsChain.offset = vi.fn().mockResolvedValue(rows);

  const countChain: Record<string, ReturnType<typeof vi.fn>> = {};
  countChain.from = vi.fn().mockReturnValue(countChain);
  countChain.where = vi.fn().mockResolvedValue([{ count: totalCount }]);

  vi.mocked(db.select)
    .mockReturnValueOnce(rowsChain as never)
    .mockReturnValueOnce(countChain as never);

  return { countChain, rowsChain };
}

describe("getUsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("selects one page newest-first and returns pagination metadata", async () => {
    const rows = [
      {
        id: "user-1",
        name: "Alice",
        email: "alice@example.com",
        role: "user",
        createdAt: new Date("2026-08-20T12:00:00Z"),
      },
    ];
    const { countChain, rowsChain } = mockUserPage(rows, 45);

    await expect(getUsersPage({ page: 3 })).resolves.toEqual({
      users: rows,
      totalCount: 45,
      totalPages: 3,
      currentPage: 3,
      pageSize: USERS_PER_PAGE,
    });

    expect(db.select).toHaveBeenCalledWith({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    });
    expect(rowsChain.from).toHaveBeenCalledWith(users);
    expect(rowsChain.where).toHaveBeenCalledWith(undefined);
    expect(desc).toHaveBeenCalledWith(users.createdAt);
    expect(rowsChain.limit).toHaveBeenCalledWith(USERS_PER_PAGE);
    expect(rowsChain.offset).toHaveBeenCalledWith(40);
    expect(countChain.from).toHaveBeenCalledWith(users);
    expect(countChain.where).toHaveBeenCalledWith(undefined);
  });

  it("searches names and emails in the database before paginating", async () => {
    const { countChain, rowsChain } = mockUserPage([], 1);

    await getUsersPage({ page: 2, search: "  Alice  " });

    expect(ilike).toHaveBeenNthCalledWith(1, users.name, "%Alice%");
    expect(ilike).toHaveBeenNthCalledWith(2, users.email, "%Alice%");
    expect(rowsChain.where).toHaveBeenCalledWith(expect.anything());
    expect(countChain.where).toHaveBeenCalledWith(expect.anything());
    expect(rowsChain.offset).toHaveBeenCalledWith(USERS_PER_PAGE);
  });

  it("normalizes an invalid page and handles an empty directory", async () => {
    mockUserPage([], 0);

    await expect(getUsersPage({ page: -8 })).resolves.toEqual({
      users: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
      pageSize: USERS_PER_PAGE,
    });
  });
});
