"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { canManageProject } from "@/lib/auth-utils";
import { COMMENT_MAX_LENGTH } from "@/lib/constants";
import { db } from "@/lib/db";
import { projectComments } from "@/lib/db/schema";

export async function addComment(
  projectId: string,
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
    const parent = await db.query.projectComments.findFirst({
      where: eq(projectComments.id, parentId),
      with: { project: { columns: { id: true } } },
    });
    if (!parent || parent.project.id !== projectId) {
      return { error: "Parent comment not found." };
    }
    if (parent.parentId !== null) {
      return { error: "Replies to replies are not supported." };
    }
    if (!(await canManageProject(session, parent.project))) {
      return { error: "Only project Gardeners or admins can reply." };
    }
  }

  await db.insert(projectComments).values({
    projectId,
    userId: session.user.id,
    content: trimmed,
    parentId: parentId ?? null,
  });
  revalidatePath(`/seeds/${projectId}`);
  return { success: true };
}

export async function archiveComment(commentId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const comment = await db.query.projectComments.findFirst({
    where: eq(projectComments.id, commentId),
    with: { project: { columns: { id: true } } },
  });
  if (!comment) return { error: "Comment not found." };
  if (!(await canManageProject(session, comment.project))) {
    return { error: "You do not have permission to remove this insight." };
  }

  const now = new Date();
  if (comment.parentId === null) {
    await db
      .update(projectComments)
      .set({ archivedAt: now })
      .where(eq(projectComments.parentId, commentId));
  }
  await db
    .update(projectComments)
    .set({ archivedAt: now })
    .where(eq(projectComments.id, commentId));

  revalidatePath(`/seeds/${comment.project.id}`);
  revalidatePath("/admin");
  return { success: true };
}

export async function unarchiveComment(commentId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "Only admins can restore archived insights." };
  }
  const comment = await db.query.projectComments.findFirst({
    where: eq(projectComments.id, commentId),
    with: { project: { columns: { id: true } } },
  });
  if (!comment) return { error: "Comment not found." };

  await db
    .update(projectComments)
    .set({ archivedAt: null })
    .where(eq(projectComments.id, commentId));
  revalidatePath(`/seeds/${comment.project.id}`);
  revalidatePath("/admin");
  return { success: true };
}
