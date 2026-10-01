import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath, updateTag } from "next/cache";
import { mockAdminSession, mockSession, setAuthMock } from "../../test-utils";

const setCalls: unknown[] = [];
const valueCalls: unknown[] = [];
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    update: vi.fn(() => ({
      set: vi.fn((value: unknown) => {
        setCalls.push(value);
        return { where: vi.fn().mockResolvedValue(undefined) };
      }),
    })),
    insert: vi.fn(() => ({
      values: vi.fn((value: unknown) => {
        valueCalls.push(value);
        return {
          onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
        };
      }),
    })),
    batch: vi.fn().mockResolvedValue([]),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  advanceToSprout,
  advanceToTree,
  approveProject,
  archiveProject,
  revertToSeed,
  revertToSprout,
  setHarvestFestPage,
  unapproveProject,
  unarchiveProject,
} from "@/lib/actions/admin";
import type { HarvestFestEvent } from "@/lib/db/queries/settings";

describe("admin project lifecycle actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCalls.length = 0;
    valueCalls.length = 0;
  });

  it("rejects non-admin lifecycle changes", async () => {
    setAuthMock(auth, mockSession());
    await expect(advanceToSprout("project-1")).rejects.toThrow("Unauthorized");
    expect(db.update).not.toHaveBeenCalled();
  });

  it("approves without changing project stage", async () => {
    setAuthMock(auth, mockAdminSession());
    await expect(approveProject("project-1")).resolves.toEqual({
      success: true,
    });
    expect(setCalls).toEqual([
      expect.objectContaining({ approvalState: "approved" }),
    ]);
    expect(setCalls[0]).not.toHaveProperty("stage");
    expect(setCalls[0]).not.toHaveProperty("archivedAt");
    expect(valueCalls).toContainEqual(
      expect.objectContaining({
        projectId: "project-1",
        approvedBy: "admin-1",
      }),
    );
    expect(db.batch).toHaveBeenCalledTimes(1);
  });

  it("unapproves without changing project stage", async () => {
    setAuthMock(auth, mockAdminSession());
    await unapproveProject("project-1");
    expect(setCalls[0]).toEqual(
      expect.objectContaining({ approvalState: "pending" }),
    );
    expect(setCalls[0]).not.toHaveProperty("stage");
  });

  it("archives with a timestamp without overwriting lifecycle state", async () => {
    setAuthMock(auth, mockAdminSession());
    await archiveProject("project-1");
    expect(setCalls[0]).toEqual(
      expect.objectContaining({ archivedAt: expect.any(Date) }),
    );
    expect(setCalls[0]).not.toHaveProperty("stage");
    expect(setCalls[0]).not.toHaveProperty("approvalState");
  });

  it("unarchives by clearing only the timestamp", async () => {
    setAuthMock(auth, mockAdminSession());
    await unarchiveProject("project-1");
    expect(setCalls[0]).toEqual(expect.objectContaining({ archivedAt: null }));
  });

  it.each([
    [advanceToSprout, "sprout"],
    [advanceToTree, "tree"],
    [revertToSeed, "seed"],
    [revertToSprout, "sprout"],
  ] as const)("changes only the project stage", async (action, stage) => {
    setAuthMock(auth, mockAdminSession());
    await action("project-1");
    expect(setCalls[0]).toEqual(expect.objectContaining({ stage }));
    expect(setCalls[0]).not.toHaveProperty("approvalState");
    expect(setCalls[0]).not.toHaveProperty("archivedAt");
  });

  it("revalidates every public lifecycle view", async () => {
    setAuthMock(auth, mockAdminSession());
    await advanceToTree("project-1");
    for (const path of [
      "/admin",
      "/",
      "/seeds/project-1",
      "/status/seeds",
      "/status/sprouts",
      "/status/trees",
    ]) {
      expect(revalidatePath).toHaveBeenCalledWith(path);
    }
  });
});

describe("setHarvestFestPage", () => {
  const event: HarvestFestEvent = {
    date: "October 3",
    time: "12–2 PM",
    title: "Eco Tours",
    location: "",
    description: "Come see the goats.",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    valueCalls.length = 0;
  });

  it("rejects non-admins", async () => {
    setAuthMock(auth, mockSession());
    await expect(
      setHarvestFestPage({ title: "Fest", tagline: "", intro: "", events: [] }),
    ).rejects.toThrow("Unauthorized");
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("names the event that failed validation", async () => {
    setAuthMock(auth, mockAdminSession());
    const result = await setHarvestFestPage({
      title: "Fest",
      tagline: "",
      intro: "",
      events: [event, { ...event, time: "  " }],
    });
    expect(result).toEqual({
      success: false,
      error: "Event 2: Time is required",
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("distinguishes the page title from event titles", async () => {
    setAuthMock(auth, mockAdminSession());
    const result = await setHarvestFestPage({
      title: "",
      tagline: "",
      intro: "",
      events: [],
    });
    expect(result).toEqual({
      success: false,
      error: "Page title is required",
    });
  });

  it("stores trimmed content without empty optional fields", async () => {
    setAuthMock(auth, mockAdminSession());
    const result = await setHarvestFestPage({
      title: "  Fest ",
      tagline: "",
      intro: "",
      events: [{ ...event, details: "", imageUrls: [], projectId: "" }],
    });
    expect(result).toEqual({ success: true });
    const stored = JSON.parse(
      (valueCalls[0] as { value: string }).value,
    ) as Record<string, unknown>;
    expect(stored).toEqual({
      title: "Fest",
      tagline: "",
      intro: "",
      events: [event],
    });
    expect(updateTag).toHaveBeenCalledWith("harvest-fest");
    expect(revalidatePath).toHaveBeenCalledWith("/harvest-fest");
  });
});
