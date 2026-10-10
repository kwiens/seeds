"use server";

import { del } from "@vercel/blob";
import { eq, inArray, or } from "drizzle-orm";
import { auth } from "@/auth";
import { canManageProject } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { projectUpdateFileDeletions, projectUpdates } from "@/lib/db/schema";
import { checkProjectAccess, requireProjectAccess } from "@/lib/project-access";
import { revalidateProject } from "@/lib/revalidate";
import { isAdmin } from "@/lib/session";
import { projectUpdateFormSchema } from "@/lib/validations/project-update";
import {
  attachmentsBelongToProject,
  teamAttachmentSchema,
  teamUpdateFormSchema,
  teamUpdateReplyFormSchema,
} from "@/lib/validations/team-update";
import { type ActionResult, firstIssue } from "./result";

export async function createPublicProjectUpdate(
  projectId: string,
  data: unknown,
): Promise<ActionResult<{ updateId: string }>> {
  const access = await requireProjectAccess(projectId, {
    level: "manage",
    forbidden: "You do not have permission to post project updates.",
  });
  if ("error" in access) return access;

  const parsed = projectUpdateFormSchema.safeParse(data);
  if (!parsed.success) return { error: firstIssue(parsed) };

  const [created] = await db
    .insert(projectUpdates)
    .values({
      projectId,
      visibility: "public",
      title: parsed.data.title,
      body: parsed.data.body,
      photos: parsed.data.photos,
      createdBy: access.session.user.id,
    })
    .returning({ id: projectUpdates.id });

  revalidateProject(projectId);
  return { success: true, updateId: created.id };
}

export async function editPublicProjectUpdate(
  updateId: string,
  data: unknown,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const update = await db.query.projectUpdates.findFirst({
    where: eq(projectUpdates.id, updateId),
    columns: { id: true, visibility: true },
    with: { project: { columns: { id: true } } },
  });
  if (!update || update.visibility !== "public") {
    return { error: "Update not found." };
  }
  if (!(await canManageProject(session, update.project))) {
    return { error: "You do not have permission to edit this update." };
  }

  const parsed = projectUpdateFormSchema.safeParse(data);
  if (!parsed.success) return { error: firstIssue(parsed) };

  await db
    .update(projectUpdates)
    .set({
      title: parsed.data.title,
      body: parsed.data.body,
      photos: parsed.data.photos,
      updatedAt: new Date(),
    })
    .where(eq(projectUpdates.id, updateId));

  revalidateProject(update.project.id);
  return { success: true };
}

export async function createTeamProjectUpdate(
  projectId: string,
  data: unknown,
): Promise<ActionResult> {
  const access = await requireProjectAccess(projectId, {
    level: "team",
    forbidden: "You do not have permission to post team updates.",
  });
  if ("error" in access) return access;

  const parsed = teamUpdateFormSchema.safeParse(data);
  if (!parsed.success) return { error: firstIssue(parsed) };
  if (!attachmentsBelongToProject(parsed.data.attachments, projectId)) {
    return { error: "Invalid attachment URL." };
  }

  await db.insert(projectUpdates).values({
    projectId,
    visibility: "team",
    createdBy: access.session.user.id,
    title: parsed.data.title || null,
    body: parsed.data.body,
    attachments: parsed.data.attachments,
  });

  revalidateProject(projectId);
  return { success: true };
}

export async function replyToTeamProjectUpdate(
  parentId: string,
  data: unknown,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in to reply." };

  const parent = await db.query.projectUpdates.findFirst({
    where: eq(projectUpdates.id, parentId),
    columns: { id: true, parentId: true, visibility: true },
    with: { project: { columns: { id: true, stage: true, archivedAt: true } } },
  });
  if (!parent || parent.visibility !== "team") {
    return { error: "Update not found." };
  }
  if (parent.parentId !== null) {
    return { error: "Replies to replies are not supported." };
  }
  const accessError = await checkProjectAccess(session, parent.project, {
    level: "team",
    forbidden: "You do not have permission to reply to this update.",
  });
  if (accessError) return { error: accessError };

  const parsed = teamUpdateReplyFormSchema.safeParse(data);
  if (!parsed.success) return { error: firstIssue(parsed) };
  if (!attachmentsBelongToProject(parsed.data.attachments, parent.project.id)) {
    return { error: "Invalid attachment URL." };
  }

  await db.insert(projectUpdates).values({
    projectId: parent.project.id,
    visibility: "team",
    createdBy: session.user.id,
    body: parsed.data.body,
    parentId,
    attachments: parsed.data.attachments,
  });

  revalidateProject(parent.project.id);
  return { success: true };
}

export async function deleteProjectUpdate(
  updateId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const update = await db.query.projectUpdates.findFirst({
    where: eq(projectUpdates.id, updateId),
    columns: { id: true, projectId: true, parentId: true, visibility: true },
    with: { project: { columns: { id: true } } },
  });
  if (!update) return { error: "Update not found." };

  if (update.visibility === "team") {
    if (!isAdmin(session)) {
      return { error: "Only admins can delete Team Updates." };
    }
  } else if (!(await canManageProject(session, update.project))) {
    return { error: "You do not have permission to delete this update." };
  }

  const deleteWhere =
    update.parentId === null
      ? or(
          eq(projectUpdates.id, updateId),
          eq(projectUpdates.parentId, updateId),
        )
      : eq(projectUpdates.id, updateId);
  await db.delete(projectUpdates).where(deleteWhere);
  if (update.visibility === "team") await processTeamFileDeletionQueue();

  revalidateProject(update.projectId);
  return { success: true };
}

export async function discardTeamAttachment(
  projectId: string,
  data: unknown,
): Promise<ActionResult> {
  const noAccess = "You do not have access to this project's files.";
  const access = await requireProjectAccess(projectId, {
    level: "team",
    forbidden: noAccess,
    unavailable: noAccess,
  });
  if ("error" in access) return { error: noAccess };

  const attachment = teamAttachmentSchema.safeParse(data);
  if (
    !attachment.success ||
    !attachmentsBelongToProject([attachment.data], projectId)
  ) {
    return { error: "Invalid attachment." };
  }

  const updates = await db.query.projectUpdates.findMany({
    where: eq(projectUpdates.projectId, projectId),
    columns: { attachments: true },
  });
  const isReferenced = updates.some((update) =>
    update.attachments.some((file) => file.url === attachment.data.url),
  );
  if (isReferenced) return { error: "This attachment is already in use." };

  await db
    .insert(projectUpdateFileDeletions)
    .values({ projectId, url: attachment.data.url })
    .onConflictDoNothing({ target: projectUpdateFileDeletions.url });
  const error = await processTeamFileDeletionQueue();
  return error ? { error } : { success: true };
}

async function processTeamFileDeletionQueue() {
  const token = process.env.TEAM_FILES_BLOB_READ_WRITE_TOKEN;
  const queued =
    (await db.query.projectUpdateFileDeletions.findMany({
      columns: { url: true },
    })) ?? [];
  const urls = queued.map((item) => item.url);
  if (urls.length === 0) return null;
  if (!token) return "Private team file storage is not configured.";

  try {
    await del(urls, { token });
    await db
      .delete(projectUpdateFileDeletions)
      .where(inArray(projectUpdateFileDeletions.url, urls));
    return null;
  } catch (error) {
    console.error("Failed to delete private Team files", error);
    return "The attachment could not be deleted. Please try again.";
  }
}
