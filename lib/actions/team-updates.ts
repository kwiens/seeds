"use server";

import { del } from "@vercel/blob";
import { eq, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { canAccessTeamUpdates } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { seedTeamFileDeletions, seedTeamUpdates } from "@/lib/db/schema";
import {
  attachmentsBelongToSeed,
  teamAttachmentSchema,
  teamUpdateFormSchema,
  teamUpdateReplyFormSchema,
} from "@/lib/validations/team-update";

export async function createTeamUpdate(seedId: string, data: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to post a team update." };
  }

  const seed = await db.query.seeds.findFirst({
    where: (seeds, { eq }) => eq(seeds.id, seedId),
    columns: { id: true, createdBy: true, status: true },
  });
  if (!seed) return { error: "Seed not found." };

  if (!(await canAccessTeamUpdates(session, seed))) {
    return {
      error: "You do not have permission to post updates for this Sprout.",
    };
  }

  if (seed.status !== "in_progress") {
    return { error: "Team Updates are only available for Sprouts." };
  }

  const parsed = teamUpdateFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }
  if (!attachmentsBelongToSeed(parsed.data.attachments, seedId)) {
    return { error: "Invalid attachment URL." };
  }

  await db.insert(seedTeamUpdates).values({
    seedId,
    userId: session.user.id,
    title: parsed.data.title || null,
    body: parsed.data.body,
    attachments: parsed.data.attachments,
  });

  revalidatePath(`/seeds/${seedId}/team`);
  revalidatePath("/dashboard/sprouts");
  return { success: true };
}

export async function replyToTeamUpdate(parentId: string, data: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to reply." };
  }

  const parent = await db.query.seedTeamUpdates.findFirst({
    where: eq(seedTeamUpdates.id, parentId),
    with: { seed: { columns: { id: true, createdBy: true, status: true } } },
  });
  if (!parent) return { error: "Update not found." };

  if (parent.parentId !== null) {
    return { error: "Replies to replies are not supported." };
  }

  if (!(await canAccessTeamUpdates(session, parent.seed))) {
    return { error: "You do not have permission to reply to this update." };
  }

  if (parent.seed.status !== "in_progress") {
    return { error: "Team Updates are only available for Sprouts." };
  }

  const parsed = teamUpdateReplyFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }
  if (!attachmentsBelongToSeed(parsed.data.attachments, parent.seed.id)) {
    return { error: "Invalid attachment URL." };
  }

  await db.insert(seedTeamUpdates).values({
    seedId: parent.seed.id,
    userId: session.user.id,
    body: parsed.data.body,
    parentId,
    attachments: parsed.data.attachments,
  });

  revalidatePath(`/seeds/${parent.seed.id}/team`);
  revalidatePath("/dashboard/sprouts");
  return { success: true };
}

export async function deleteTeamUpdate(updateId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "Only admins can delete Team Updates." };
  }

  const update = await db.query.seedTeamUpdates.findFirst({
    where: eq(seedTeamUpdates.id, updateId),
    columns: { id: true, seedId: true, parentId: true },
  });
  if (!update) return { error: "Update not found." };

  // Delete a top-level update and its replies in one statement so a failed
  // second query or a concurrent reply cannot leave a partial thread behind.
  const deleteWhere =
    update.parentId === null
      ? or(
          eq(seedTeamUpdates.id, updateId),
          eq(seedTeamUpdates.parentId, updateId),
        )
      : eq(seedTeamUpdates.id, updateId);
  await db.delete(seedTeamUpdates).where(deleteWhere);
  // A DB trigger queues every removed row's files, including replies deleted
  // by the self-FK cascade. Cleanup failures remain queued for a later retry.
  await processTeamFileDeletionQueue();

  revalidatePath(`/seeds/${update.seedId}/team`);
  revalidatePath("/dashboard/sprouts");
  return { success: true };
}

export async function discardTeamAttachment(seedId: string, data: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const seed = await db.query.seeds.findFirst({
    where: (seeds, { eq }) => eq(seeds.id, seedId),
    columns: { id: true, createdBy: true, status: true },
  });
  if (
    !seed ||
    seed.status !== "in_progress" ||
    !(await canAccessTeamUpdates(session, seed))
  ) {
    return { error: "You do not have access to this Sprout's files." };
  }

  const attachment = teamAttachmentSchema.safeParse(data);
  if (
    !attachment.success ||
    !attachmentsBelongToSeed([attachment.data], seedId)
  ) {
    return { error: "Invalid attachment." };
  }

  const updates = await db.query.seedTeamUpdates.findMany({
    where: eq(seedTeamUpdates.seedId, seedId),
    columns: { attachments: true },
  });
  const isReferenced = updates.some((update) =>
    update.attachments.some((file) => file.url === attachment.data.url),
  );
  if (isReferenced) return { error: "This attachment is already in use." };

  await db
    .insert(seedTeamFileDeletions)
    .values({ seedId, url: attachment.data.url })
    .onConflictDoNothing({ target: seedTeamFileDeletions.url });
  const error = await processTeamFileDeletionQueue();
  return error ? { error } : { success: true };
}

async function processTeamFileDeletionQueue() {
  const token = process.env.TEAM_FILES_BLOB_READ_WRITE_TOKEN;
  const queued =
    (await db.query.seedTeamFileDeletions.findMany({
      columns: { url: true },
    })) ?? [];
  const urls = queued.map((item) => item.url);
  if (urls.length === 0) return null;
  if (!token) return "Private team file storage is not configured.";

  try {
    await del(urls, { token });
    await db
      .delete(seedTeamFileDeletions)
      .where(inArray(seedTeamFileDeletions.url, urls));
    return null;
  } catch (error) {
    console.error("Failed to delete private Team files", error);
    return "The attachment could not be deleted. Please try again.";
  }
}
