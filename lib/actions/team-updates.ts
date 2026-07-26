"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { canAccessTeamUpdates } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { seedTeamUpdates } from "@/lib/db/schema";
import {
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

  if (!canAccessTeamUpdates(session, seed)) {
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

  await db.insert(seedTeamUpdates).values({
    seedId,
    userId: session.user.id,
    title: parsed.data.title || null,
    body: parsed.data.body,
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

  if (!canAccessTeamUpdates(session, parent.seed)) {
    return { error: "You do not have permission to reply to this update." };
  }

  if (parent.seed.status !== "in_progress") {
    return { error: "Team Updates are only available for Sprouts." };
  }

  const parsed = teamUpdateReplyFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }

  await db.insert(seedTeamUpdates).values({
    seedId: parent.seed.id,
    userId: session.user.id,
    body: parsed.data.body,
    parentId,
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

  // Deleting a top-level update takes its replies with it — an orphaned
  // reply with no visible parent would be confusing to leave behind.
  if (update.parentId === null) {
    await db
      .delete(seedTeamUpdates)
      .where(eq(seedTeamUpdates.parentId, updateId));
  }

  await db.delete(seedTeamUpdates).where(eq(seedTeamUpdates.id, updateId));

  revalidatePath(`/seeds/${update.seedId}/team`);
  revalidatePath("/dashboard/sprouts");
  return { success: true };
}
