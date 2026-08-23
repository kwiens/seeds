import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      projectInvites: { findMany: vi.fn(), findFirst: vi.fn() },
    },
  },
}));

import { db } from "@/lib/db";
import { getInviteByToken, getPendingInvites } from "@/lib/db/queries/invites";

const rows = [
  {
    id: "guide",
    token: "guide-token",
    invitedName: "Guide",
    role: "guide",
    createdAt: new Date(),
  },
  {
    id: "steward",
    token: "steward-token",
    invitedName: "Steward",
    role: "steward",
    createdAt: new Date(),
  },
];

describe("invite queries", () => {
  it("returns links only when the viewer can manage that role", async () => {
    vi.mocked(db.query.projectInvites.findMany).mockResolvedValue(
      rows as never,
    );

    for (const [access, expectedLinks] of [
      [{ canManage: false, isAdmin: false }, [null, null]],
      [{ canManage: true, isAdmin: false }, ["/invite/guide-token", null]],
      [
        { canManage: true, isAdmin: true },
        ["/invite/guide-token", "/invite/steward-token"],
      ],
    ] as const) {
      const result = await getPendingInvites("project-1", access);
      expect(result.map((invite) => invite.link)).toEqual(expectedLinks);
      expect(result.some((invite) => "token" in invite)).toBe(false);
    }
  });

  it("rejects malformed route tokens before querying the database", async () => {
    const result = await getInviteByToken("not-a-token");

    expect(result).toBeNull();
    expect(db.query.projectInvites.findFirst).not.toHaveBeenCalled();
  });
});
