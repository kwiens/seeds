import { describe, expect, it, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import {
  mockSession,
  mockAdminSession,
  mockDbInsertSimpleChain,
  mockDbUpdateChain,
  mockDbDeleteChain,
  setAuthMock,
} from "../../test-utils";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/auth-utils", () => ({
  canManageProject: vi.fn(
    async (session, project) =>
      session?.user?.role === "admin" ||
      session?.user?.id === project.createdBy,
  ),
}));
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      projects: { findFirst: vi.fn() },
      projectEvents: { findFirst: vi.fn() },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/lib/actions/team-events";

function mockSeedRow(overrides?: Record<string, unknown>) {
  return {
    id: "seed-1",
    createdBy: "user-1",
    stage: "sprout",
    ...overrides,
  };
}

function mockEventRow(overrides?: Record<string, unknown>) {
  return {
    id: "event-1",
    projectId: "seed-1",
    title: "Site visit",
    startsAt: new Date("2099-08-01T18:00:00Z"),
    location: null,
    project: mockSeedRow(),
    ...overrides,
  };
}

const validEventData = {
  title: "Site visit",
  startsAt: new Date("2099-08-01T18:00:00Z"),
};

describe("createEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);
    const result = await createEvent("seed-1", validEventData);
    expect(result).toEqual({ error: "You must be signed in." });
  });

  it("returns error when seed not found", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(undefined);

    const result = await createEvent("nonexistent", validEventData);
    expect(result).toEqual({ error: "Project not found." });
  });

  it("rejects a non-owner non-admin", async () => {
    setAuthMock(auth, mockSession({ id: "other-user" }));
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSeedRow() as any,
    );

    const result = await createEvent("seed-1", validEventData);
    expect(result).toEqual({
      error: "You do not have permission to add events for this project.",
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("rejects a seed that is not a Sprout", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSeedRow({ stage: "seed" }) as any,
    );

    const result = await createEvent("seed-1", validEventData);

    expect(result).toEqual({
      error: "Events become available at the Sprout stage.",
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("rejects an event in the past", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSeedRow() as any,
    );

    const result = await createEvent("seed-1", {
      title: "Already happened",
      startsAt: new Date(Date.now() - 60_000),
    });

    expect(result).toEqual({ error: "Event must be in the future" });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("validates form data", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSeedRow() as any,
    );

    const result = await createEvent("seed-1", { title: "" });
    expect(result).toHaveProperty("error");
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("creates an event as the Gardener", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSeedRow() as any,
    );
    const chain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);

    const result = await createEvent("seed-1", {
      title: "Site visit",
      startsAt: new Date("2099-08-01T18:00:00Z"),
      location: "123 Main St",
    });

    expect(result).toEqual({ success: true });
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "seed-1",
        createdBy: "user-1",
        title: "Site visit",
        startsAt: new Date("2099-08-01T18:00:00Z"),
        location: "123 Main St",
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1/team");
  });

  it("stores a null location when omitted", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSeedRow() as any,
    );
    const chain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);

    await createEvent("seed-1", validEventData);

    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({ location: null }),
    );
  });

  it("allows an admin to create an event on any Sprout", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue(
      mockSeedRow({ createdBy: "someone-else" }) as any,
    );
    const chain = mockDbInsertSimpleChain();
    vi.mocked(db.insert).mockReturnValue(chain as any);

    const result = await createEvent("seed-1", validEventData);
    expect(result).toEqual({ success: true });
  });
});

describe("updateEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);
    const result = await updateEvent("event-1", validEventData);
    expect(result).toEqual({ error: "You must be signed in." });
  });

  it("returns error when event not found", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projectEvents.findFirst).mockResolvedValue(undefined);

    const result = await updateEvent("nonexistent", validEventData);
    expect(result).toEqual({ error: "Event not found." });
  });

  it("rejects a non-owner non-admin", async () => {
    setAuthMock(auth, mockSession({ id: "other-user" }));
    vi.mocked(db.query.projectEvents.findFirst).mockResolvedValue(
      mockEventRow() as any,
    );

    const result = await updateEvent("event-1", validEventData);
    expect(result).toEqual({
      error: "You do not have permission to edit this event.",
    });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("rejects an event whose seed is no longer a Sprout", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projectEvents.findFirst).mockResolvedValue(
      mockEventRow({ project: mockSeedRow({ stage: "seed" }) }) as any,
    );

    const result = await updateEvent("event-1", validEventData);

    expect(result).toEqual({
      error: "Events become available at the Sprout stage.",
    });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("validates form data", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projectEvents.findFirst).mockResolvedValue(
      mockEventRow() as any,
    );

    const result = await updateEvent("event-1", { title: "" });
    expect(result).toHaveProperty("error");
    expect(db.update).not.toHaveBeenCalled();
  });

  it("updates an event as the Gardener", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projectEvents.findFirst).mockResolvedValue(
      mockEventRow() as any,
    );
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await updateEvent("event-1", {
      title: "Rescheduled site visit",
      startsAt: new Date("2099-08-02T18:00:00Z"),
      location: "456 Oak Ave",
    });

    expect(result).toEqual({ success: true });
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Rescheduled site visit",
        startsAt: new Date("2099-08-02T18:00:00Z"),
        location: "456 Oak Ave",
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1/team");
  });

  it("allows an admin to update an event on any Sprout", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.projectEvents.findFirst).mockResolvedValue(
      mockEventRow({
        project: mockSeedRow({ createdBy: "someone-else" }),
      }) as any,
    );
    const chain = mockDbUpdateChain();
    vi.mocked(db.update).mockReturnValue(chain as any);

    const result = await updateEvent("event-1", validEventData);
    expect(result).toEqual({ success: true });
  });
});

describe("deleteEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    setAuthMock(auth, null);
    const result = await deleteEvent("event-1");
    expect(result).toEqual({ error: "You must be signed in." });
  });

  it("returns error when event not found", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projectEvents.findFirst).mockResolvedValue(undefined);

    const result = await deleteEvent("nonexistent");
    expect(result).toEqual({ error: "Event not found." });
  });

  it("rejects a non-owner non-admin", async () => {
    setAuthMock(auth, mockSession({ id: "other-user" }));
    vi.mocked(db.query.projectEvents.findFirst).mockResolvedValue(
      mockEventRow() as any,
    );

    const result = await deleteEvent("event-1");
    expect(result).toEqual({
      error: "You do not have permission to delete this event.",
    });
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("rejects an event whose seed is no longer a Sprout", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projectEvents.findFirst).mockResolvedValue(
      mockEventRow({ project: mockSeedRow({ stage: "seed" }) }) as any,
    );

    const result = await deleteEvent("event-1");

    expect(result).toEqual({
      error: "Events become available at the Sprout stage.",
    });
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("deletes an event as the Gardener", async () => {
    setAuthMock(auth, mockSession({ id: "user-1" }));
    vi.mocked(db.query.projectEvents.findFirst).mockResolvedValue(
      mockEventRow() as any,
    );
    const chain = mockDbDeleteChain();
    vi.mocked(db.delete).mockReturnValue(chain as any);

    const result = await deleteEvent("event-1");

    expect(result).toEqual({ success: true });
    expect(db.delete).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/seeds/seed-1/team");
  });

  it("allows an admin to delete an event on any Sprout", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(db.query.projectEvents.findFirst).mockResolvedValue(
      mockEventRow({
        project: mockSeedRow({ createdBy: "someone-else" }),
      }) as any,
    );
    const chain = mockDbDeleteChain();
    vi.mocked(db.delete).mockReturnValue(chain as any);

    const result = await deleteEvent("event-1");
    expect(result).toEqual({ success: true });
  });
});
