import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: { select: vi.fn() },
}));

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: vi.fn(actual.eq),
    ilike: vi.fn(actual.ilike),
    inArray: vi.fn(actual.inArray),
    isNotNull: vi.fn(actual.isNotNull),
  };
});

import { eq, ilike, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  ADMIN_PROJECTS_PER_PAGE,
  getProjectsPage,
  getSupporterEmailsMap,
  isAdminProjectStageFilter,
} from "@/lib/db/queries/admin";
import { projectParticipants, projects } from "@/lib/db/schema";

function mockProjectPage(rows: unknown[], totalCount: number) {
  const rowsChain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const step of ["from", "innerJoin", "where", "orderBy", "limit"]) {
    rowsChain[step] = vi.fn().mockReturnValue(rowsChain);
  }
  rowsChain.offset = vi.fn().mockResolvedValue(rows);
  const countChain: Record<string, ReturnType<typeof vi.fn>> = {};
  countChain.from = vi.fn().mockReturnValue(countChain);
  countChain.where = vi.fn().mockResolvedValue([{ count: totalCount }]);
  vi.mocked(db.select)
    .mockReturnValueOnce(rowsChain as never)
    .mockReturnValueOnce(countChain as never);
  return { rowsChain, countChain };
}

describe("isAdminProjectStageFilter", () => {
  it("accepts the three stages and archived", () => {
    expect(isAdminProjectStageFilter("seed")).toBe(true);
    expect(isAdminProjectStageFilter("archived")).toBe(true);
    expect(isAdminProjectStageFilter("all")).toBe(false);
    expect(isAdminProjectStageFilter(undefined)).toBe(false);
  });
});

describe("getProjectsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pages newest-first and reports totals", async () => {
    const { rowsChain } = mockProjectPage([{ id: "p1" }], 51);

    const result = await getProjectsPage({ page: 3 });

    expect(result.currentPage).toBe(3);
    expect(result.totalCount).toBe(51);
    expect(result.totalPages).toBe(3);
    expect(result.pageSize).toBe(ADMIN_PROJECTS_PER_PAGE);
    expect(rowsChain.limit).toHaveBeenCalledWith(ADMIN_PROJECTS_PER_PAGE);
    expect(rowsChain.offset).toHaveBeenCalledWith(2 * ADMIN_PROJECTS_PER_PAGE);
    expect(rowsChain.where).toHaveBeenCalledWith(undefined);
  });

  it("filters by name in the database", async () => {
    mockProjectPage([], 0);
    await getProjectsPage({ search: " garden " });
    expect(ilike).toHaveBeenCalledWith(projects.name, "%garden%");
  });

  it("filters a stage to unarchived projects of that stage", async () => {
    mockProjectPage([], 0);
    await getProjectsPage({ stage: "sprout" });
    expect(eq).toHaveBeenCalledWith(projects.stage, "sprout");
    expect(isNotNull).not.toHaveBeenCalled();
  });

  it("filters archived projects across every stage", async () => {
    mockProjectPage([], 0);
    await getProjectsPage({ stage: "archived" });
    expect(isNotNull).toHaveBeenCalledWith(projects.archivedAt);
  });
});

describe("getSupporterEmailsMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips the query entirely for an empty page", async () => {
    const result = await getSupporterEmailsMap([]);
    expect(result.size).toBe(0);
    expect(db.select).not.toHaveBeenCalled();
  });

  it("scopes the lookup to the given project ids and groups by project", async () => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};
    chain.from = vi.fn().mockReturnValue(chain);
    chain.innerJoin = vi.fn().mockReturnValue(chain);
    chain.where = vi.fn().mockResolvedValue([
      { projectId: "p1", email: "a@example.com" },
      { projectId: "p1", email: "b@example.com" },
      { projectId: "p2", email: "c@example.com" },
    ]);
    vi.mocked(db.select).mockReturnValue(chain as never);

    const result = await getSupporterEmailsMap(["p1", "p2"]);

    expect(inArray).toHaveBeenCalledWith(projectParticipants.projectId, [
      "p1",
      "p2",
    ]);
    expect(result.get("p1")).toEqual(["a@example.com", "b@example.com"]);
    expect(result.get("p2")).toEqual(["c@example.com"]);
  });
});
