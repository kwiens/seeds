import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { mockSession, setAuthMock } from "../../test-utils";

vi.mock("@vercel/blob/client", () => ({ handleUpload: vi.fn() }));
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/auth-utils", () => ({ canAccessTeamWorkspace: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      projects: { findFirst: vi.fn() },
    },
  },
}));

import { auth } from "@/auth";
import { canAccessTeamWorkspace } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { POST } from "@/app/api/upload/route";

// Mirrors the real @vercel/blob/client handleUpload contract closely enough
// to exercise the route's own logic (auth checks, attachment path/ownership
// validation, and the config it hands back for each upload type). Real
// signature verification and blob storage calls happen inside the SDK and
// are out of scope for this route's tests.
function mockHandleUploadImpl({
  body,
  token,
  onBeforeGenerateToken,
}: {
  body: HandleUploadBody;
  request: NextRequest;
  token?: string;
  onBeforeGenerateToken?: (
    pathname: string,
    clientPayload: string | null,
  ) => Promise<Record<string, unknown>>;
}) {
  if (body.type === "blob.generate-client-token") {
    return (async () => {
      const config = await onBeforeGenerateToken?.(
        body.payload.pathname,
        body.payload.clientPayload,
      );
      return {
        type: "blob.generate-client-token" as const,
        clientToken: "mock-client-token",
        token,
        ...config,
      };
    })();
  }
  return Promise.resolve({
    type: "blob.upload-completed" as const,
    response: "ok",
  });
}

function generateTokenBody(
  pathname: string,
  clientPayload: string | null = null,
): HandleUploadBody {
  return {
    type: "blob.generate-client-token",
    payload: { pathname, multipart: false, clientPayload },
  } as HandleUploadBody;
}

function uploadCompletedBody(pathname: string): HandleUploadBody {
  return {
    type: "blob.upload-completed",
    payload: {
      blob: {
        pathname,
        contentType: "image/png",
        contentDisposition: "",
        url: `https://blob.example/${pathname}`,
        downloadUrl: `https://blob.example/${pathname}?download=1`,
      },
      tokenPayload: null,
    },
  } as unknown as HandleUploadBody;
}

function postRequest(body: HandleUploadBody) {
  return new NextRequest("http://localhost/api/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(handleUpload).mockImplementation(mockHandleUploadImpl as any);
    delete process.env.TEAM_FILES_BLOB_READ_WRITE_TOKEN;
  });

  afterEach(() => {
    delete process.env.TEAM_FILES_BLOB_READ_WRITE_TOKEN;
  });

  it("rejects an image upload token request when unauthenticated", async () => {
    setAuthMock(auth, null);

    const response = await POST(postRequest(generateTokenBody("avatar.png")));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Not authenticated" });
    expect(db.query.projects.findFirst).not.toHaveBeenCalled();
  });

  it("rejects an attachment upload token request when unauthenticated", async () => {
    process.env.TEAM_FILES_BLOB_READ_WRITE_TOKEN = "team-token";
    setAuthMock(auth, null);

    const response = await POST(
      postRequest(
        generateTokenBody(
          "projects/proj-1/attachments/plan.pdf",
          JSON.stringify({ projectId: "proj-1" }),
        ),
      ),
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Not authenticated" });
    expect(db.query.projects.findFirst).not.toHaveBeenCalled();
  });

  it("rejects an attachment upload when private team file storage is not configured", async () => {
    setAuthMock(auth, mockSession());

    const response = await POST(
      postRequest(
        generateTokenBody(
          "projects/proj-1/attachments/plan.pdf",
          JSON.stringify({ projectId: "proj-1" }),
        ),
      ),
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: "Private team file storage is not configured",
    });
    // The check short-circuits before the SDK is ever invoked.
    expect(handleUpload).not.toHaveBeenCalled();
  });

  it("rejects an attachment upload with a missing/invalid clientPayload projectId", async () => {
    process.env.TEAM_FILES_BLOB_READ_WRITE_TOKEN = "team-token";
    setAuthMock(auth, mockSession());

    const response = await POST(
      postRequest(
        generateTokenBody("projects/proj-1/attachments/plan.pdf", null),
      ),
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Invalid attachment upload request" });
    expect(db.query.projects.findFirst).not.toHaveBeenCalled();
  });

  it("rejects an attachment upload when the pathname's project does not match the clientPayload projectId", async () => {
    process.env.TEAM_FILES_BLOB_READ_WRITE_TOKEN = "team-token";
    setAuthMock(auth, mockSession());

    const response = await POST(
      postRequest(
        generateTokenBody(
          "projects/proj-1/attachments/plan.pdf",
          JSON.stringify({ projectId: "proj-2" }),
        ),
      ),
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Invalid attachment upload request" });
  });

  it("rejects an attachment upload for a project without a team workspace", async () => {
    process.env.TEAM_FILES_BLOB_READ_WRITE_TOKEN = "team-token";
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue({
      id: "proj-1",
      stage: "seed",
    } as any);

    const response = await POST(
      postRequest(
        generateTokenBody(
          "projects/proj-1/attachments/plan.pdf",
          JSON.stringify({ projectId: "proj-1" }),
        ),
      ),
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: "You do not have access to this project's files",
    });
    expect(canAccessTeamWorkspace).not.toHaveBeenCalled();
  });

  it("rejects an attachment upload when the user cannot access the team workspace", async () => {
    process.env.TEAM_FILES_BLOB_READ_WRITE_TOKEN = "team-token";
    setAuthMock(auth, mockSession());
    vi.mocked(db.query.projects.findFirst).mockResolvedValue({
      id: "proj-1",
      stage: "sprout",
    } as any);
    vi.mocked(canAccessTeamWorkspace).mockResolvedValue(false);

    const response = await POST(
      postRequest(
        generateTokenBody(
          "projects/proj-1/attachments/plan.pdf",
          JSON.stringify({ projectId: "proj-1" }),
        ),
      ),
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: "You do not have access to this project's files",
    });
  });

  it("issues a public image upload token with image constraints", async () => {
    setAuthMock(auth, mockSession({ id: "user-42" }));

    const response = await POST(
      postRequest(generateTokenBody("avatars/pic.png")),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.allowedContentTypes).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ]);
    expect(json.maximumSizeInBytes).toBe(5 * 1024 * 1024);
    expect(json.addRandomSuffix).toBe(true);
    expect(JSON.parse(json.tokenPayload)).toEqual({ userId: "user-42" });

    // Public image uploads never pass the private team-files token to the SDK.
    const call = vi.mocked(handleUpload).mock.calls[0][0];
    expect(call.token).toBeUndefined();
  });

  it("issues an attachment upload token with document constraints and the team token", async () => {
    process.env.TEAM_FILES_BLOB_READ_WRITE_TOKEN = "team-token";
    setAuthMock(auth, mockSession({ id: "user-42" }));
    vi.mocked(db.query.projects.findFirst).mockResolvedValue({
      id: "proj-1",
      stage: "sprout",
    } as any);
    vi.mocked(canAccessTeamWorkspace).mockResolvedValue(true);

    const response = await POST(
      postRequest(
        generateTokenBody(
          "projects/proj-1/attachments/plan.pdf",
          JSON.stringify({ projectId: "proj-1" }),
        ),
      ),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.allowedContentTypes).toEqual(
      expect.arrayContaining([
        "image/jpeg",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]),
    );
    expect(json.maximumSizeInBytes).toBe(20 * 1024 * 1024);
    expect(json.addRandomSuffix).toBe(true);
    expect(JSON.parse(json.tokenPayload)).toEqual({ userId: "user-42" });

    const call = vi.mocked(handleUpload).mock.calls[0][0];
    expect(call.token).toBe("team-token");
  });

  it("passes through a blob.upload-completed event without touching auth or the db", async () => {
    setAuthMock(auth, null);

    const response = await POST(
      postRequest(uploadCompletedBody("avatars/pic.png")),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ type: "blob.upload-completed", response: "ok" });
    expect(db.query.projects.findFirst).not.toHaveBeenCalled();
  });

  it("falls back to a generic error message when the SDK throws a non-Error value", async () => {
    setAuthMock(auth, mockSession());
    vi.mocked(handleUpload).mockRejectedValue("boom");

    const response = await POST(
      postRequest(generateTokenBody("avatars/pic.png")),
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Upload failed" });
  });
});
