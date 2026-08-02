import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: { query: { projectParticipants: { findFirst: vi.fn() } } },
}));

import { db } from "@/lib/db";
import { canAccessTeamWorkspace, canManageProject } from "@/lib/auth-utils";
import { mockSession } from "../test-utils";

const project = { id: "project-1" };

describe("project authorization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("denies anonymous users", async () => {
    await expect(canManageProject(null, project)).resolves.toBe(false);
    await expect(canAccessTeamWorkspace(null, project)).resolves.toBe(false);
  });

  it("lets admins manage every project without a participant query", async () => {
    await expect(
      canManageProject(mockSession({ role: "admin" }), project),
    ).resolves.toBe(true);
    expect(db.query.projectParticipants.findFirst).not.toHaveBeenCalled();
  });

  it("lets active gardeners and co-gardeners manage a project", async () => {
    vi.mocked(db.query.projectParticipants.findFirst).mockResolvedValue({
      id: "participant-1",
    } as never);
    await expect(canManageProject(mockSession(), project)).resolves.toBe(true);
  });

  it("denies management when no active leadership role exists", async () => {
    vi.mocked(db.query.projectParticipants.findFirst).mockResolvedValue(
      undefined,
    );
    await expect(canManageProject(mockSession(), project)).resolves.toBe(false);
  });

  it.each([
    "admin",
    "council",
  ])("lets %s users access all team workspaces", async (role) => {
    await expect(
      canAccessTeamWorkspace(mockSession({ role }), project),
    ).resolves.toBe(true);
  });

  it("lets active team participants access the workspace", async () => {
    vi.mocked(db.query.projectParticipants.findFirst).mockResolvedValue({
      id: "participant-1",
    } as never);
    await expect(canAccessTeamWorkspace(mockSession(), project)).resolves.toBe(
      true,
    );
  });

  it("does not treat supporter-only participation as team access", async () => {
    vi.mocked(db.query.projectParticipants.findFirst).mockResolvedValue(
      undefined,
    );
    await expect(canAccessTeamWorkspace(mockSession(), project)).resolves.toBe(
      false,
    );
  });
});
