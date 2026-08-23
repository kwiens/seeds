import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: { select: vi.fn() },
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    desc: vi.fn(actual.desc),
  };
});

import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { getAllUsers } from "@/lib/db/queries/admin";
import { users } from "@/lib/db/schema";

function mockUserSelect(rows: unknown[]) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockResolvedValue(rows);
  vi.mocked(db.select).mockReturnValue(chain as never);
  return chain;
}

describe("getAllUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("selects the directory fields and orders newest accounts first", async () => {
    const rows = [
      {
        id: "user-1",
        name: "Alice",
        email: "alice@example.com",
        role: "user",
        createdAt: new Date("2026-08-20T12:00:00Z"),
      },
    ];
    const chain = mockUserSelect(rows);

    await expect(getAllUsers()).resolves.toEqual(rows);

    expect(db.select).toHaveBeenCalledWith({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    });
    expect(chain.from).toHaveBeenCalledWith(users);
    expect(desc).toHaveBeenCalledWith(users.createdAt);
    expect(chain.orderBy).toHaveBeenCalledOnce();
  });

  it("returns an empty array when there are no accounts", async () => {
    mockUserSelect([]);

    await expect(getAllUsers()).resolves.toEqual([]);
  });
});
