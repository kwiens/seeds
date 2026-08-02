import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import {
  mockSession,
  setAuthMock,
  validProjectFormData,
} from "../../test-utils";

const valueCalls: unknown[] = [];
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      projects: { findFirst: vi.fn() },
      projectParticipants: { findFirst: vi.fn() },
    },
    insert: vi.fn(() => ({
      values: vi.fn((values: unknown) => {
        valueCalls.push(values);
        return { kind: "insert" };
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({ where: vi.fn(() => ({ kind: "update" })) })),
    })),
    delete: vi.fn(() => ({ where: vi.fn(() => ({ kind: "delete" })) })),
    batch: vi.fn().mockResolvedValue([]),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createProject, updateProject } from "@/lib/actions/projects";

describe("project actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    valueCalls.length = 0;
  });

  it("requires authentication to create", async () => {
    setAuthMock(auth, null);
    await expect(createProject(validProjectFormData())).resolves.toEqual({
      error: "You must be signed in to plant a seed.",
    });
  });

  it("validates project input", async () => {
    setAuthMock(auth, mockSession());
    await expect(createProject({ name: "" })).resolves.toHaveProperty("error");
    expect(db.batch).not.toHaveBeenCalled();
  });

  it("creates one permanent project at the seed/pending state", async () => {
    setAuthMock(auth, mockSession({ name: "Garden Lead" }));
    await expect(createProject(validProjectFormData())).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(valueCalls[0]).toEqual(
      expect.objectContaining({
        stage: "seed",
        approvalState: "pending",
        createdBy: "user-1",
        budgetEstimate: null,
      }),
    );
    expect(db.batch).toHaveBeenCalledTimes(1);
  });

  it("creates the submitter as an active gardener participant", async () => {
    setAuthMock(auth, mockSession({ id: "gardener-1", name: "Garden Lead" }));
    await expect(createProject(validProjectFormData())).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(valueCalls[1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: "gardener-1",
          displayName: "Garden Lead",
          role: "gardener",
          state: "active",
        }),
      ]),
    );
  });

  it("stores estimate and people without creating stage-specific records", async () => {
    setAuthMock(auth, mockSession({ name: "Lead" }));
    const form = validProjectFormData({
      budgetEstimate: "$5k–$8k",
      gardeners: ["Lead", "Co Lead"],
      roots: [{ name: "Committed Org", committed: true }],
      supportPeople: ["Possible Guide"],
    });
    await expect(createProject(form)).rejects.toThrow("NEXT_REDIRECT");

    expect(valueCalls[0]).toEqual(
      expect.objectContaining({ budgetEstimate: "$5k–$8k" }),
    );
    expect(valueCalls[1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: "gardener", state: "active" }),
        expect.objectContaining({ role: "roots", state: "active" }),
        expect.objectContaining({ role: "guide", state: "prospective" }),
      ]),
    );
  });

  it("requires an active leadership participant to update", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue({
      id: "project-1",
      participants: [],
    } as never);
    vi.mocked(db.query.projectParticipants.findFirst).mockResolvedValue(
      undefined,
    );

    await expect(
      updateProject("project-1", validProjectFormData()),
    ).resolves.toEqual({
      error: "You don't have permission to edit this project.",
    });
  });

  it("updates the aggregate and anonymous form participants atomically", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue({
      id: "project-1",
      participants: [
        { userId: "user-1", displayName: "Test User", role: "gardener" },
      ],
    } as never);
    vi.mocked(db.query.projectParticipants.findFirst).mockResolvedValue({
      id: "participant-1",
    } as never);

    await expect(
      updateProject(
        "project-1",
        validProjectFormData({ gardeners: ["Test User", "New Gardener"] }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(db.update).toHaveBeenCalledTimes(1);
    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(db.batch).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/seeds/project-1");
  });
});
