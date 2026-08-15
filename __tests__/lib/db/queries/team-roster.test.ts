import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    and: vi.fn(actual.and),
    eq: vi.fn(actual.eq),
    ne: vi.fn(actual.ne),
    asc: vi.fn(actual.asc),
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      projectParticipants: { findMany: vi.fn() },
    },
  },
}));

import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectParticipants } from "@/lib/db/schema";
import { getTeamMembers } from "@/lib/db/queries/team-roster";

function participantRow(overrides?: Record<string, unknown>) {
  return {
    id: "participant-1",
    projectId: "seed-1",
    userId: "user-1",
    role: "guide",
    state: "active",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    user: { id: "user-1", name: "Alice", image: null },
    addedByUser: { name: "Bob" },
    ...overrides,
  };
}

describe("getTeamMembers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters to active, non-supporter participants for the project, ordered by join date", async () => {
    vi.mocked(db.query.projectParticipants.findMany).mockResolvedValue([]);

    await getTeamMembers("seed-1");

    expect(eq).toHaveBeenCalledWith(projectParticipants.projectId, "seed-1");
    expect(eq).toHaveBeenCalledWith(projectParticipants.state, "active");
    expect(ne).toHaveBeenCalledWith(projectParticipants.role, "supporter");
    expect(asc).toHaveBeenCalledWith(projectParticipants.createdAt);
    expect(and).toHaveBeenCalled();

    const call = vi.mocked(db.query.projectParticipants.findMany).mock
      .calls[0][0];
    expect(call).toHaveProperty("where");
    expect(call).toHaveProperty("orderBy");
    expect(call?.with).toEqual({
      user: { columns: { id: true, name: true, image: true } },
      addedByUser: { columns: { name: true } },
    });
  });

  it("shapes a single-role row into a roster member", async () => {
    vi.mocked(db.query.projectParticipants.findMany).mockResolvedValue([
      participantRow(),
    ] as never);

    const result = await getTeamMembers("seed-1");

    expect(result).toEqual([
      {
        userId: "user-1",
        name: "Alice",
        image: null,
        roleLabels: ["Guide"],
        addedByName: "Bob",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      },
    ]);
  });

  it("merges multiple team roles for the same user into one roster entry", async () => {
    vi.mocked(db.query.projectParticipants.findMany).mockResolvedValue([
      participantRow({ role: "guide", createdAt: new Date("2024-01-01") }),
      participantRow({ role: "roots", createdAt: new Date("2024-01-02") }),
    ] as never);

    const result = await getTeamMembers("seed-1");

    expect(result).toHaveLength(1);
    expect(result[0].roleLabels).toEqual(["Guide", "Roots"]);
    // joinedAt reflects the first-seen row, not the later duplicate.
    expect(result[0].joinedAt).toEqual(new Date("2024-01-01"));
  });

  it("does not duplicate a role label already recorded for the user", async () => {
    vi.mocked(db.query.projectParticipants.findMany).mockResolvedValue([
      participantRow({ role: "guide" }),
      participantRow({ role: "guide" }),
    ] as never);

    const result = await getTeamMembers("seed-1");

    expect(result).toHaveLength(1);
    expect(result[0].roleLabels).toEqual(["Guide"]);
  });

  it("skips participant rows without a linked user", async () => {
    vi.mocked(db.query.projectParticipants.findMany).mockResolvedValue([
      participantRow({ user: null }),
    ] as never);

    const result = await getTeamMembers("seed-1");

    expect(result).toEqual([]);
  });

  it("defaults addedByName to null when there is no addedByUser", async () => {
    vi.mocked(db.query.projectParticipants.findMany).mockResolvedValue([
      participantRow({ addedByUser: null }),
    ] as never);

    const result = await getTeamMembers("seed-1");

    expect(result[0].addedByName).toBeNull();
  });

  it("preserves multiple distinct members in query order", async () => {
    vi.mocked(db.query.projectParticipants.findMany).mockResolvedValue([
      participantRow({
        userId: "user-1",
        user: { id: "user-1", name: "Alice", image: null },
      }),
      participantRow({
        userId: "user-2",
        role: "roots",
        user: { id: "user-2", name: "Bea", image: null },
      }),
    ] as never);

    const result = await getTeamMembers("seed-1");

    expect(result.map((m) => m.userId)).toEqual(["user-1", "user-2"]);
  });

  it("returns an empty array when there are no team members", async () => {
    vi.mocked(db.query.projectParticipants.findMany).mockResolvedValue([]);

    const result = await getTeamMembers("seed-1");

    expect(result).toEqual([]);
  });
});
