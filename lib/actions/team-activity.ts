"use server";

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectActivityReads } from "@/lib/db/schema";
import { requireProjectAccess } from "@/lib/project-access";

/**
 * Records how far a team member has read in the private workspace. It fails
 * silently: a lost read marker is a minor annoyance, not an error to surface.
 */
export async function markProjectActivityRead(
  projectId: string,
  readThrough: string,
) {
  const access = await requireProjectAccess(projectId, { level: "team" });
  if ("error" in access) return;

  const requestedReadThrough = new Date(readThrough);
  if (Number.isNaN(requestedReadThrough.getTime())) return;
  const effectiveReadThrough = new Date(
    Math.min(requestedReadThrough.getTime(), Date.now()),
  );

  await db
    .insert(projectActivityReads)
    .values({
      projectId,
      userId: access.session.user.id,
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
