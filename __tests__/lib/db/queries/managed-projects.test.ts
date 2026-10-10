import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: { select: vi.fn() },
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: vi.fn(actual.eq),
    inArray: vi.fn(actual.inArray),
    or: vi.fn(actual.or),
  };
});

import { eq, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { getManagedProjectsByUser } from "@/lib/db/queries/projects";
import { projectParticipants, projects } from "@/lib/db/schema";
import { managementRoles } from "@/lib/participant-roles";

describe("getManagedProjectsByUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes projects the user created or holds a management role on", async () => {
    // First select builds the management-role subquery; the second is the
    // project list.
    const subquery: Record<string, ReturnType<typeof vi.fn>> = {};
    subquery.from = vi.fn().mockReturnValue(subquery);
    subquery.where = vi.fn().mockReturnValue(subquery);

    const list: Record<string, ReturnType<typeof vi.fn>> = {};
    list.from = vi.fn().mockReturnValue(list);
    list.where = vi.fn().mockReturnValue(list);
    list.orderBy = vi.fn().mockReturnValue(list);
    list.limit = vi.fn().mockReturnValue(list);
    list.offset = vi.fn().mockResolvedValue([{ id: "p1" }]);
    const countQuery = {
      from: vi.fn(),
      where: vi.fn().mockResolvedValue([{ count: 201 }]),
    };
    countQuery.from.mockReturnValue(countQuery);

    vi.mocked(db.select)
      .mockReturnValueOnce(subquery as never)
      .mockReturnValueOnce(countQuery as never)
      .mockReturnValueOnce(list as never);

    const result = await getManagedProjectsByUser("user-1", 99);

    expect(result).toEqual({
      projects: [{ id: "p1" }],
      totalCount: 201,
      totalPages: 11,
      currentPage: 11,
    });
    expect(eq).toHaveBeenCalledWith(projects.createdBy, "user-1");
    expect(eq).toHaveBeenCalledWith(projectParticipants.userId, "user-1");
    expect(inArray).toHaveBeenCalledWith(
      projectParticipants.role,
      managementRoles,
    );
    expect(inArray).toHaveBeenCalledWith(projects.id, subquery);
    expect(or).toHaveBeenCalled();
    expect(list.limit).toHaveBeenCalledWith(20);
    expect(list.offset).toHaveBeenCalledWith(200);
  });
});
