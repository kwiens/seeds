"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { canEditSeed } from "@/lib/auth-utils";
import { COMMENT_MAX_LENGTH } from "@/lib/constants";
import { db } from "@/lib/db";
import { seedComments, seeds } from "@/lib/db/schema";

export async function addComment(
  seedId: string,
  content: string,
  parentId?: string,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to share an insight." };
  }

  const trimmed = content.trim();
  if (!trimmed || trimmed.length > COMMENT_MAX_LENGTH) {
    return {
      error: `Insight must be between 1 and ${COMMENT_MAX_LENGTH.toLocaleString()} characters.`,
    };
  }

  if (parentId) {
    const seed = await db.query.seeds.findFirst({
      where: eq(seeds.id, seedId),
      columns: { createdBy: true },
    });
    if (!seed) return { error: "Seed not found." };
    if (!canEditSeed(session, seed)) {
      return { error: "Only the seed creator or admins can reply." };
    }
  }

  await db.insert(seedComments).values({
    seedId,
    userId: session.user.id,
    content: trimmed,
    parentId: parentId ?? null,
  });

  revalidatePath(`/seeds/${seedId}`);
  return { success: true };
}

export async function archiveComment(commentId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const comment = await db.query.seedComments.findFirst({
    where: eq(seedComments.id, commentId),
    with: { seed: { columns: { id: true, createdBy: true } } },
  });

  if (!comment) return { error: "Comment not found." };

  if (!canEditSeed(session, { createdBy: comment.seed.createdBy })) {
    return { error: "You do not have permission to remove this insight." };
  }

  const now = new Date();

  // If archiving a top-level comment, also archive its replies
  if (comment.parentId === null) {
    await db
      .update(seedComments)
      .set({ archivedAt: now })
      .where(eq(seedComments.parentId, commentId));
  }

  await db
    .update(seedComments)
    .set({ archivedAt: now })
    .where(eq(seedComments.id, commentId));

  revalidatePath(`/seeds/${comment.seed.id}`);
  revalidatePath("/admin");
  return { success: true };
}

export async function unarchiveComment(commentId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "Only admins can restore archived insights." };
  }

  const comment = await db.query.seedComments.findFirst({
    where: eq(seedComments.id, commentId),
    with: { seed: { columns: { id: true } } },
  });

  if (!comment) return { error: "Comment not found." };

  await db
    .update(seedComments)
    .set({ archivedAt: null })
    .where(eq(seedComments.id, commentId));

  revalidatePath(`/seeds/${comment.seed.id}`);
  revalidatePath("/admin");
  return { success: true };
}
