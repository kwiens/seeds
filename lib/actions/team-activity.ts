"use server";

import { eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { canAccessTeamWorkspace } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { projectActivityReads, projects } from "@/lib/db/schema";
import { hasTeamWorkspace } from "@/lib/project-stages";

export async function markProjectActivityRead(
  projectId: string,
  readThrough: string,
) {
  const session = await auth();
  if (!session?.user?.id) return;

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { id: true, stage: true },
  });
  if (
    !project ||
    !hasTeamWorkspace(project.stage) ||
    !(await canAccessTeamWorkspace(session, project))
  )
    return;

  const requestedReadThrough = new Date(readThrough);
  if (Number.isNaN(requestedReadThrough.getTime())) return;
  const effectiveReadThrough = new Date(
    Math.min(requestedReadThrough.getTime(), Date.now()),
  );

  await db
    .insert(projectActivityReads)
    .values({
      projectId,
      userId: session.user.id,
      visibility: "team",
      lastReadAt: effectiveReadThrough,
    })
    .onConflictDoUpdate({
      target: [
        projectActivityReads.projectId,
        projectActivityReads.userId,
        projectActivityReads.visibility,
      ],
      set: {
        lastReadAt: sql`greatest(${projectActivityReads.lastReadAt}, ${effectiveReadThrough})`,
      },
    });
}
