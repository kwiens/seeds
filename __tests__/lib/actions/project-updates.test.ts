import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockAdminSession, mockSession, setAuthMock } from "../../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@vercel/blob", () => ({ del: vi.fn() }));
vi.mock("@/lib/auth-utils", () => ({
  canManageProject: vi.fn(),
  canAccessTeamWorkspace: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      projects: { findFirst: vi.fn() },
      projectUpdates: { findFirst: vi.fn(), findMany: vi.fn() },
      projectUpdateFileDeletions: { findMany: vi.fn() },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { canAccessTeamWorkspace, canManageProject } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import {
  createPublicProjectUpdate,
  createTeamProjectUpdate,
  deleteProjectUpdate,
  discardTeamAttachment,
  editPublicProjectUpdate,
  replyToTeamProjectUpdate,
} from "@/lib/actions/project-updates";

const richBody = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "News" }] }],
};
const attachment = {
  name: "plan.pdf",
  url: "https://test.private.blob.vercel-storage.com/projects/project-1/attachments/plan.pdf",
  size: 1000,
};

function insertChain(returning = [{ id: "update-1" }]) {
  const onConflictDoNothing = vi.fn().mockResolvedValue(undefined);
  const values = vi.fn(() => ({
    returning: vi.fn().mockResolvedValue(returning),
    onConflictDoNothing,
  }));
  return { values, onConflictDoNothing };
}

function mutationChain() {
  const where = vi.fn().mockResolvedValue(undefined);
  return { set: vi.fn(() => ({ where })), where };
}

describe("unified project updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.query.projectUpdateFileDeletions.findMany).mockResolvedValue(
      [] as never,
    );
    vi.mocked(db.query.projectUpdates.findMany).mockResolvedValue([] as never);
    vi.mocked(canManageProject).mockResolvedValue(true);
    vi.mocked(canAccessTeamWorkspace).mockResolvedValue(true);
  });

  it("requires authentication for public and team posts", async () => {
    setAuthMock(auth, null);
    await expect(
      createPublicProjectUpdate("project-1", { title: "News", body: richBody }),
    ).resolves.toHaveProperty("error");
    await expect(
      createTeamProjectUpdate("project-1", { body: "News" }),
    ).resolves.toHaveProperty("error");
  });

  it("creates public progress with explicit public visibility", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue({
      id: "project-1",
      stage: "seed",
    } as never);
    const chain = insertChain();
    vi.mocked(db.insert).mockReturnValue(chain as never);

    await expect(
      createPublicProjectUpdate("project-1", { title: "News", body: richBody }),
    ).resolves.toEqual({ success: true, updateId: "update-1" });
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project-1",
        visibility: "public",
        title: "News",
        body: richBody,
        createdBy: "user-1",
      }),
    );
  });

  it("requires project leadership for public updates", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue({
      id: "project-1",
      stage: "seed",
    } as never);
    vi.mocked(canManageProject).mockResolvedValue(false);
    await expect(
      createPublicProjectUpdate("project-1", { title: "News", body: richBody }),
    ).resolves.toEqual({
      error: "You do not have permission to post project updates.",
    });
  });

  it("does not expose the team workspace at Seed stage", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue({
      id: "project-1",
      stage: "seed",
    } as never);
    await expect(
      createTeamProjectUpdate("project-1", { body: "Internal" }),
    ).resolves.toEqual({
      error: "The team workspace becomes available at the Sprout stage.",
    });
  });

  it.each([
    "sprout",
    "tree",
  ] as const)("retains team updates at the %s stage", async (stage) => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue({
      id: "project-1",
      stage,
    } as never);
    const chain = insertChain();
    vi.mocked(db.insert).mockReturnValue(chain as never);

    await expect(
      createTeamProjectUpdate("project-1", {
        title: "Internal",
        body: "Team only",
        attachments: [attachment],
      }),
    ).resolves.toEqual({ success: true });
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project-1",
        visibility: "team",
        body: "Team only",
        attachments: [attachment],
      }),
    );
  });

  it("requires an active team participant for team updates", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue({
      id: "project-1",
      stage: "sprout",
    } as never);
    vi.mocked(canAccessTeamWorkspace).mockResolvedValue(false);
    await expect(
      createTeamProjectUpdate("project-1", { body: "Internal" }),
    ).resolves.toHaveProperty("error");
  });

  it("rejects an attachment belonging to another project", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue({
      id: "project-1",
      stage: "sprout",
    } as never);
    await expect(
      createTeamProjectUpdate("project-1", {
        body: "Internal",
        attachments: [
          {
            ...attachment,
            url: attachment.url.replace("project-1", "project-2"),
          },
        ],
      }),
    ).resolves.toEqual({ error: "Invalid attachment URL." });
  });

  it("stores replies in the same table and visibility domain", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectUpdates.findFirst).mockResolvedValue({
      id: "update-1",
      parentId: null,
      visibility: "team",
      project: { id: "project-1", stage: "tree" },
    } as never);
    const chain = insertChain();
    vi.mocked(db.insert).mockReturnValue(chain as never);

    await expect(
      replyToTeamProjectUpdate("update-1", { body: "Reply" }),
    ).resolves.toEqual({ success: true });
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project-1",
        visibility: "team",
        parentId: "update-1",
      }),
    );
  });

  it("prevents nested replies", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectUpdates.findFirst).mockResolvedValue({
      id: "reply-1",
      parentId: "update-1",
      visibility: "team",
      project: { id: "project-1", stage: "sprout" },
    } as never);
    await expect(
      replyToTeamProjectUpdate("reply-1", { body: "Nested" }),
    ).resolves.toEqual({ error: "Replies to replies are not supported." });
  });

  it("only edits updates whose visibility is public", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectUpdates.findFirst).mockResolvedValue({
      id: "update-1",
      visibility: "team",
      project: { id: "project-1" },
    } as never);
    await expect(
      editPublicProjectUpdate("update-1", { title: "News", body: richBody }),
    ).resolves.toEqual({ error: "Update not found." });
  });

  it("allows project leadership to edit a public update", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectUpdates.findFirst).mockResolvedValue({
      id: "update-1",
      visibility: "public",
      project: { id: "project-1" },
    } as never);
    const chain = mutationChain();
    vi.mocked(db.update).mockReturnValue(chain as never);
    await expect(
      editPublicProjectUpdate("update-1", { title: "News", body: richBody }),
    ).resolves.toEqual({ success: true });
  });

  it("requires admins to delete team-visible updates", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectUpdates.findFirst).mockResolvedValue({
      id: "update-1",
      projectId: "project-1",
      parentId: null,
      visibility: "team",
      project: { id: "project-1" },
    } as never);
    await expect(deleteProjectUpdate("update-1")).resolves.toEqual({
      error: "Only admins can delete Team Updates.",
    });
  });

  it("allows admins to delete a team thread", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.projectUpdates.findFirst).mockResolvedValue({
      id: "update-1",
      projectId: "project-1",
      parentId: null,
      visibility: "team",
      project: { id: "project-1" },
    } as never);
    const chain = mutationChain();
    vi.mocked(db.delete).mockReturnValue(chain as never);
    await expect(deleteProjectUpdate("update-1")).resolves.toEqual({
      success: true,
    });
    expect(db.delete).toHaveBeenCalledTimes(1);
  });

  it("refuses to discard an attachment already referenced by an update", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue({
      id: "project-1",
      stage: "sprout",
    } as never);
    vi.mocked(db.query.projectUpdates.findMany).mockResolvedValue([
      { attachments: [attachment] },
    ] as never);
    await expect(
      discardTeamAttachment("project-1", attachment),
    ).resolves.toEqual({ error: "This attachment is already in use." });
  });
});
