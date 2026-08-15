import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    and: vi.fn(actual.and),
    eq: vi.fn(actual.eq),
    gte: vi.fn(actual.gte),
    asc: vi.fn(actual.asc),
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      projectEvents: { findMany: vi.fn() },
    },
  },
}));

import { and, asc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectEvents } from "@/lib/db/schema";
import { getUpcomingEvents } from "@/lib/db/queries/team-events";

describe("getUpcomingEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters by project id and a future start time, ordered ascending", async () => {
    vi.mocked(db.query.projectEvents.findMany).mockResolvedValue([]);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2099-06-15T00:00:00Z"));

    await getUpcomingEvents("seed-1");

    expect(eq).toHaveBeenCalledWith(projectEvents.projectId, "seed-1");
    expect(gte).toHaveBeenCalledWith(
      projectEvents.startsAt,
      new Date("2099-06-15T00:00:00Z"),
    );
    expect(asc).toHaveBeenCalledWith(projectEvents.startsAt);
    expect(and).toHaveBeenCalled();

    const call = vi.mocked(db.query.projectEvents.findMany).mock.calls[0][0];
    expect(call).toHaveProperty("where");
    expect(call).toHaveProperty("orderBy");

    vi.useRealTimers();
  });

  it("returns the rows resolved by the database", async () => {
    const rows = [
      {
        id: "event-1",
        projectId: "seed-1",
        title: "Site visit",
        startsAt: new Date("2099-08-01T18:00:00Z"),
        location: "123 Main St",
      },
    ];
    vi.mocked(db.query.projectEvents.findMany).mockResolvedValue(rows as never);

    const result = await getUpcomingEvents("seed-1");

    expect(result).toBe(rows);
  });

  it("returns an empty array when there are no upcoming events", async () => {
    vi.mocked(db.query.projectEvents.findMany).mockResolvedValue([]);

    const result = await getUpcomingEvents("seed-1");

    expect(result).toEqual([]);
  });
});
