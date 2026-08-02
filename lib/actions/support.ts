"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projectParticipants, projects } from "@/lib/db/schema";

const AUTO_APPROVE_THRESHOLD = 10;

export async function toggleSupport(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to support a seed." };
  }

  const existing = await db.query.projectParticipants.findFirst({
    where: and(
      eq(projectParticipants.projectId, projectId),
      eq(projectParticipants.userId, session.user.id),
      eq(projectParticipants.role, "supporter"),
    ),
  });

  let promoted = false;
  try {
    if (existing) {
      const nextState = existing.state === "active" ? "inactive" : "active";
      await db
        .update(projectParticipants)
        .set({ state: nextState, updatedAt: new Date() })
        .where(eq(projectParticipants.id, existing.id));
      if (nextState === "active") {
        promoted = await autoApproveIfEligible(projectId);
      }
    } else {
      await db.insert(projectParticipants).values({
        projectId,
        userId: session.user.id,
        displayName: session.user.name?.trim() || "Supporter",
        role: "supporter",
        state: "active",
        addedBy: session.user.id,
      });
      promoted = await autoApproveIfEligible(projectId);
    }
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }

  revalidatePath(`/seeds/${projectId}`);
  revalidatePath("/");
  if (promoted) {
    revalidatePath("/admin");
    revalidatePath("/status/seeds");
  }
  return { success: true };
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

async function autoApproveIfEligible(projectId: string) {
  const updated = await db
    .update(projects)
    .set({ approvalState: "approved", updatedAt: new Date() })
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.stage, "seed"),
        eq(projects.approvalState, "pending"),
        sql`(
          SELECT COUNT(*) FROM ${projectParticipants}
          WHERE ${projectParticipants.projectId} = ${projectId}
            AND ${projectParticipants.role} = 'supporter'
            AND ${projectParticipants.state} = 'active'
        ) >= ${AUTO_APPROVE_THRESHOLD}`,
      ),
    )
    .returning({ id: projects.id });

  return updated.length > 0;
}
