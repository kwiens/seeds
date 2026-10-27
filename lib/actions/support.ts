"use server";

import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { siteConfig } from "@/config/site";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db/errors";
import { projectParticipants, projects } from "@/lib/db/schema";
import { revalidateProject } from "@/lib/revalidate";
import type { ActionResult } from "./result";

const AUTO_APPROVE_THRESHOLD = siteConfig.community.autoApproveSupportThreshold;

export async function toggleSupport(projectId: string): Promise<ActionResult> {
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

  try {
    if (existing) {
      const nextState = existing.state === "active" ? "inactive" : "active";
      await db
        .update(projectParticipants)
        .set({ state: nextState, updatedAt: new Date() })
        .where(eq(projectParticipants.id, existing.id));
      if (nextState === "active") await autoApproveIfEligible(projectId);
    } else {
      await db.insert(projectParticipants).values({
        projectId,
        userId: session.user.id,
        displayName: session.user.name?.trim() || "Supporter",
        role: "supporter",
        state: "active",
        addedBy: session.user.id,
      });
      await autoApproveIfEligible(projectId);
    }
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }

  revalidateProject(projectId);
  return { success: true };
}

async function autoApproveIfEligible(projectId: string) {
  if (AUTO_APPROVE_THRESHOLD === null) return false;
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
