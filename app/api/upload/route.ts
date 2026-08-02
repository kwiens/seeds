import { type NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/auth";
import { canAccessTeamWorkspace } from "@/lib/auth-utils";
import { TEAM_ATTACHMENT_MAX_SIZE } from "@/lib/constants";
import { db } from "@/lib/db";
import { hasTeamWorkspace } from "@/lib/project-stages";

const IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const DOCUMENT_TYPES = [
  ...IMAGE_TYPES,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const attachmentUpload = isAttachmentUpload(body);
    if (attachmentUpload && !process.env.TEAM_FILES_BLOB_READ_WRITE_TOKEN) {
      throw new Error("Private team file storage is not configured");
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      token: attachmentUpload
        ? process.env.TEAM_FILES_BLOB_READ_WRITE_TOKEN
        : undefined,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await auth();
        if (!session?.user?.id) {
          throw new Error("Not authenticated");
        }

        const attachmentProjectId = parseAttachmentProjectId(clientPayload);
        if (attachmentUpload) {
          if (
            !attachmentProjectId ||
            !pathname.startsWith(`projects/${attachmentProjectId}/attachments/`)
          ) {
            throw new Error("Invalid attachment upload request");
          }

          const project = await db.query.projects.findFirst({
            where: (projects, { eq }) => eq(projects.id, attachmentProjectId),
            columns: { id: true, stage: true },
          });
          if (
            !project ||
            !hasTeamWorkspace(project.stage) ||
            !(await canAccessTeamWorkspace(session, project))
          ) {
            throw new Error("You do not have access to this project's files");
          }
        }

        return {
          allowedContentTypes: attachmentUpload ? DOCUMENT_TYPES : IMAGE_TYPES,
          maximumSizeInBytes: attachmentUpload
            ? TEAM_ATTACHMENT_MAX_SIZE
            : IMAGE_MAX_FILE_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        };
      },
      onUploadCompleted: async () => {
        // No-op: photos are saved to the seed record on form submit
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    );
  }
}

function isAttachmentUpload(body: HandleUploadBody) {
  const pathname =
    body.type === "blob.generate-client-token"
      ? body.payload.pathname
      : body.payload.blob.pathname;
  return /^projects\/[^/]+\/attachments\//.test(pathname);
}

function parseAttachmentProjectId(clientPayload: string | null) {
  if (!clientPayload) return null;
  try {
    const parsed: unknown = JSON.parse(clientPayload);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "projectId" in parsed &&
      typeof parsed.projectId === "string"
    ) {
      return parsed.projectId;
    }
  } catch {
    // Invalid payloads are rejected by the caller.
  }
  return null;
}
