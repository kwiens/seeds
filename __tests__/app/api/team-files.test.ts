import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "@vercel/blob";
import { mockSession, setAuthMock } from "../../test-utils";

vi.mock("@vercel/blob", () => ({ get: vi.fn() }));
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/auth-utils", () => ({ canAccessTeamWorkspace: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      projectUpdates: { findFirst: vi.fn() },
    },
  },
}));

import { auth } from "@/auth";
import { canAccessTeamWorkspace } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { GET } from "@/app/api/team-files/[updateId]/[attachmentIndex]/route";

const context = {
  params: Promise.resolve({ updateId: "update-1", attachmentIndex: "0" }),
};

function mockUpdate(overrides?: { attachmentName?: string }) {
  return {
    attachments: [
      {
        name: overrides?.attachmentName ?? "plan.pdf",
        url: "https://test.private.blob.vercel-storage.com/projects/seed-1/attachments/plan.pdf",
        size: 4,
      },
    ],
    visibility: "team",
    project: { id: "seed-1", stage: "sprout" },
  };
}

function mockBlobResult(contentType: string) {
  return {
    statusCode: 200,
    stream: new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3, 4]));
        controller.close();
      },
    }),
    blob: { size: 4, contentType },
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
    expect(db.query.projectUpdates.findFirst).not.toHaveBeenCalled();
  });

  it("does not fetch the blob for a user outside the Sprout team", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectUpdates.findFirst).mockResolvedValue(
      mockUpdate() as any,
    );
    vi.mocked(canAccessTeamWorkspace).mockResolvedValue(false);

    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(403);
    expect(get).not.toHaveBeenCalled();
  });

  it("streams a private blob only after Team access is verified", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectUpdates.findFirst).mockResolvedValue(
      mockUpdate() as any,
    );
    vi.mocked(canAccessTeamWorkspace).mockResolvedValue(true);
    vi.mocked(get).mockResolvedValue(mockBlobResult("application/pdf") as any);

    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(200);
    expect(get).toHaveBeenCalledWith(mockUpdate().attachments[0].url, {
      access: "private",
      token: "private-token",
    });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("forces a download for a non-image attachment", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectUpdates.findFirst).mockResolvedValue(
      mockUpdate({ attachmentName: "plan.pdf" }) as any,
    );
    vi.mocked(canAccessTeamWorkspace).mockResolvedValue(true);
    vi.mocked(get).mockResolvedValue(mockBlobResult("application/pdf") as any);

    const response = await GET(new Request("http://localhost"), context);

    expect(response.headers.get("content-disposition")).toMatch(/^attachment;/);
  });

  it("serves an image attachment inline so it can be previewed", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectUpdates.findFirst).mockResolvedValue(
      mockUpdate({ attachmentName: "photo.png" }) as any,
    );
    vi.mocked(canAccessTeamWorkspace).mockResolvedValue(true);
    vi.mocked(get).mockResolvedValue(mockBlobResult("image/png") as any);

    const response = await GET(new Request("http://localhost"), context);

    expect(response.headers.get("content-disposition")).toMatch(/^inline;/);
  });

  it("still forces a download for an image when ?download is present", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projectUpdates.findFirst).mockResolvedValue(
      mockUpdate({ attachmentName: "photo.png" }) as any,
    );
    vi.mocked(canAccessTeamWorkspace).mockResolvedValue(true);
    vi.mocked(get).mockResolvedValue(mockBlobResult("image/png") as any);

    const response = await GET(
      new Request("http://localhost/api/team-files/update-1/0?download=1"),
      context,
    );

    expect(response.headers.get("content-disposition")).toMatch(/^attachment;/);
  });
});
