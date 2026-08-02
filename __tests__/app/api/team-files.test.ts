import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "@vercel/blob";
import { mockSession, setAuthMock } from "../../test-utils";

vi.mock("@vercel/blob", () => ({ get: vi.fn() }));
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/auth-utils", () => ({ canAccessTeamUpdates: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      seedTeamUpdates: { findFirst: vi.fn() },
    },
  },
}));

import { auth } from "@/auth";
import { canAccessTeamUpdates } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { GET } from "@/app/api/team-files/[updateId]/[attachmentIndex]/route";

const context = {
  params: Promise.resolve({ updateId: "update-1", attachmentIndex: "0" }),
};

function mockUpdate() {
  return {
    attachments: [
      {
        name: "plan.pdf",
        url: "https://test.private.blob.vercel-storage.com/seeds/seed-1/attachments/plan.pdf",
        size: 4,
      },
    ],
    seed: { id: "seed-1", createdBy: "user-1", status: "in_progress" },
  };
}

describe("GET /api/team-files/[updateId]/[attachmentIndex]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TEAM_FILES_BLOB_READ_WRITE_TOKEN = "private-token";
  });

  afterEach(() => {
    delete process.env.TEAM_FILES_BLOB_READ_WRITE_TOKEN;
  });

  it("requires authentication before looking up the update", async () => {
    setAuthMock(auth, null);

    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(401);
    expect(db.query.seedTeamUpdates.findFirst).not.toHaveBeenCalled();
  });

  it("does not fetch the blob for a user outside the Sprout team", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.seedTeamUpdates.findFirst).mockResolvedValue(
      mockUpdate() as any,
    );
    vi.mocked(canAccessTeamUpdates).mockResolvedValue(false);

    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(403);
    expect(get).not.toHaveBeenCalled();
  });

  it("streams a private blob only after Team access is verified", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.seedTeamUpdates.findFirst).mockResolvedValue(
      mockUpdate() as any,
    );
    vi.mocked(canAccessTeamUpdates).mockResolvedValue(true);
    vi.mocked(get).mockResolvedValue({
      statusCode: 200,
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3, 4]));
          controller.close();
        },
      }),
      blob: { size: 4, contentType: "application/pdf" },
    } as any);

    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(200);
    expect(get).toHaveBeenCalledWith(mockUpdate().attachments[0].url, {
      access: "private",
      token: "private-token",
    });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});
