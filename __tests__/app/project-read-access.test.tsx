import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockProject, mockSession, setAuthMock } from "../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/auth-utils", () => ({
  canManageProject: vi.fn(),
  canAccessTeamWorkspace: vi.fn(),
}));
vi.mock("@/lib/db/queries/projects", () => ({
  getProjectById: vi.fn(),
  getProjectSupportCount: vi.fn().mockResolvedValue(0),
  getProjectSupporters: vi.fn().mockResolvedValue([]),
  hasUserSupported: vi.fn().mockResolvedValue(false),
}));
vi.mock("@/lib/db/queries/project-updates", () => ({
  getPublicProjectUpdateById: vi.fn(),
  getPublicProjectUpdates: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/db/queries/comments", () => ({
  getCommentsByProject: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/db/queries/budgets", () => ({
  getPublicBudgets: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/app/seeds/[id]/seed-detail-map", () => ({
  SeedDetailMap: () => null,
}));

import { auth } from "@/auth";
import { canManageProject } from "@/lib/auth-utils";
import {
  getProjectById,
  getProjectSupporters,
} from "@/lib/db/queries/projects";
import { getPublicProjectUpdateById } from "@/lib/db/queries/project-updates";
import SeedPage, {
  generateMetadata as seedMetadata,
} from "@/app/seeds/[id]/page";
import UpdatePage, {
  generateMetadata as updateMetadata,
} from "@/app/seeds/[id]/updates/[updateId]/page";

const seedProps = { params: Promise.resolve({ id: "seed-1" }) };
const updateProps = {
  params: Promise.resolve({ id: "seed-1", updateId: "update-1" }),
};
const update = {
  id: "update-1",
  projectId: "seed-1",
  title: "Sensitive update",
  body: {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Secret body" }] },
    ],
  },
  photos: [],
  createdBy: "user-1",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  authorName: "Test User",
  authorImage: null,
};

describe("public project pages and metadata share read authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthMock(auth, null);
    vi.mocked(canManageProject).mockResolvedValue(false);
    vi.mocked(getProjectById).mockResolvedValue(mockProject() as never);
    vi.mocked(getPublicProjectUpdateById).mockResolvedValue(update);
  });

  it.each([
    ["draft", { approvalState: "draft" }],
    ["archived", { archivedAt: new Date() }],
  ])("hides %s details and metadata from anonymous and non-manager viewers", async (_label, overrides) => {
    vi.mocked(getProjectById).mockResolvedValue(
      mockProject(overrides) as never,
    );
    for (const session of [
      null,
      mockSession({ id: "outsider" }),
      mockSession({ role: "council" }),
    ]) {
      setAuthMock(auth, session);
      expect.soft(await seedMetadata(seedProps)).toEqual({
        title: "Seed Not Found",
      });
      expect.soft(await updateMetadata(updateProps)).toEqual({
        title: "Update Not Found",
      });
      await expect(SeedPage(seedProps)).rejects.toThrow("NEXT_NOT_FOUND");
      await expect(UpdatePage(updateProps)).rejects.toThrow("NEXT_NOT_FOUND");
    }
    expect(getProjectSupporters).not.toHaveBeenCalled();
    expect(getPublicProjectUpdateById).not.toHaveBeenCalled();
  });

  it.each([
    "pending",
    "approved",
  ])("keeps %s project pages and metadata public", async (approvalState) => {
    vi.mocked(getProjectById).mockResolvedValue(
      mockProject({ approvalState }) as never,
    );
    expect(await seedMetadata(seedProps)).toMatchObject({
      title: "Community Garden | Seeds",
    });
    expect(await updateMetadata(updateProps)).toMatchObject({
      title: "Sensitive update | Seeds",
      description: "Secret body",
    });
    await expect(SeedPage(seedProps)).resolves.toBeTruthy();
    await expect(UpdatePage(updateProps)).resolves.toBeTruthy();
  });

  it.each([
    { approvalState: "draft" },
    { archivedAt: new Date() },
  ])("lets authorized managers read restricted projects and metadata: %j", async (overrides) => {
    setAuthMock(auth, mockSession());
    vi.mocked(canManageProject).mockResolvedValue(true);
    vi.mocked(getProjectById).mockResolvedValue(
      mockProject(overrides) as never,
    );
    expect(await seedMetadata(seedProps)).toMatchObject({
      title: "Community Garden | Seeds",
    });
    expect(await updateMetadata(updateProps)).toMatchObject({
      title: "Sensitive update | Seeds",
    });
    await expect(SeedPage(seedProps)).resolves.toBeTruthy();
    await expect(UpdatePage(updateProps)).resolves.toBeTruthy();
  });

  it("does not disclose an update through another project's URL, even to a manager", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(canManageProject).mockResolvedValue(true);
    vi.mocked(getPublicProjectUpdateById).mockResolvedValue({
      ...update,
      projectId: "other-project",
    });
    expect(await updateMetadata(updateProps)).toEqual({
      title: "Update Not Found",
    });
    await expect(UpdatePage(updateProps)).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("returns generic metadata and notFound for missing projects and updates", async () => {
    // The query returns null for an empty result; its array indexing type
    // omits that branch when noUncheckedIndexedAccess is disabled.
    vi.mocked(getPublicProjectUpdateById).mockResolvedValue(null as never);
    expect(await updateMetadata(updateProps)).toEqual({
      title: "Update Not Found",
    });
    await expect(UpdatePage(updateProps)).rejects.toThrow("NEXT_NOT_FOUND");
    vi.mocked(getProjectById).mockResolvedValue(null);
    expect(await seedMetadata(seedProps)).toEqual({ title: "Seed Not Found" });
    await expect(SeedPage(seedProps)).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
