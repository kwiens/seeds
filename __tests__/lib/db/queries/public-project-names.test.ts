import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

vi.mock("@/lib/db", () => ({ db: { select: vi.fn() } }));

import { db } from "@/lib/db";
import { getPublicProjectNames } from "@/lib/db/queries/projects";

describe("public project names for stored Harvest Fest links", () => {
  beforeEach(() => vi.clearAllMocks());

  it("excludes drafts and archived projects in the database query", async () => {
    const where = vi
      .fn()
      .mockResolvedValue([{ id: "project-1", name: "Public project" }]);
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({ where }),
    } as never);
    const names = await getPublicProjectNames(["project-1"]);
    const query = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
    expect(query.sql).toContain('"projects"."id" in');
    expect(query.sql).toContain('"projects"."approval_state" <>');
    expect(query.sql).toContain('"projects"."archived_at" is null');
    expect(query.params).toEqual(["project-1", "draft"]);
    expect(names.get("project-1")).toBe("Public project");
  });

  it("does not query all project names when there are no stored links", async () => {
    expect(await getPublicProjectNames([])).toEqual(new Map());
    expect(db.select).not.toHaveBeenCalled();
  });
});
