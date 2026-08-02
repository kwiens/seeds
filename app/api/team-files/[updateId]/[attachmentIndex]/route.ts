import { get } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessTeamUpdates } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { seedTeamUpdates } from "@/lib/db/schema";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ updateId: string; attachmentIndex: string }>;
  },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { updateId, attachmentIndex: rawIndex } = await context.params;
  const attachmentIndex = Number(rawIndex);
  if (!Number.isInteger(attachmentIndex) || attachmentIndex < 0) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const update = await db.query.seedTeamUpdates.findFirst({
    where: eq(seedTeamUpdates.id, updateId),
    columns: { attachments: true },
    with: {
      seed: { columns: { id: true, createdBy: true, status: true } },
    },
  });
  const attachment = update?.attachments[attachmentIndex];
  if (!update || !attachment || update.seed.status !== "in_progress") {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  if (!(await canAccessTeamUpdates(session, update.seed))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = process.env.TEAM_FILES_BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Private team file storage is not configured" },
      { status: 503 },
    );
  }

  const result = await getPrivateBlob(attachment.url, token);
  if (!result || result.statusCode !== 200) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const filename = encodeURIComponent(attachment.name);
  return new Response(result.stream, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="download"; filename*=UTF-8''${filename}`,
      "Content-Length": String(result.blob.size),
      "Content-Type": result.blob.contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function getPrivateBlob(url: string, token: string) {
  try {
    return await get(url, { access: "private", token });
  } catch {
    return null;
  }
}
