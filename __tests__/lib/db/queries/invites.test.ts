import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      projectInvites: { findMany: vi.fn() },
    },
  },
}));

import { db } from "@/lib/db";
import { getPendingInvites } from "@/lib/db/queries/invites";

const rows = [
  {
    id: "guide-invite",
    token: "guide-token",
    invitedName: "Priya Guide",
    role: "guide",
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "steward-invite",
    token: "steward-token",
    invitedName: "Sana Steward",
    role: "steward",
    createdAt: new Date("2026-01-02"),
  },
];

describe("getPendingInvites", () => {
  beforeEach(() => {
    vi.mocked(db.query.projectInvites.findMany).mockResolvedValue(
      rows as never,
    );
  });

  it.each([
    [
      "read-only team members",
      { canManage: false, isAdmin: false },
      [null, null],
    ],
    [
      "project managers",
      { canManage: true, isAdmin: false },
      ["/invite/guide-token", null],
    ],
    [
      "admins",
      { canManage: true, isAdmin: true },
      ["/invite/guide-token", "/invite/steward-token"],
    ],
  ])("returns only authorized links to %s", async (_case, access, links) => {
    const result = await getPendingInvites("project-1", access);

    expect(result.map((invite) => invite.link)).toEqual(links);
    expect(result.every((invite) => !("token" in invite))).toBe(true);
  });
});
