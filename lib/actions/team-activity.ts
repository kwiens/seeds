"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { canAccessTeamUpdates } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { seeds, seedTeamActivityReads } from "@/lib/db/schema";

export async function markSproutActivityRead(
  seedId: string,
  readThrough: string,
) {
  const session = await auth();
  if (!session?.user?.id) return;

  const seed = await db.query.seeds.findFirst({
    where: eq(seeds.id, seedId),
    columns: { id: true, createdBy: true, status: true },
  });
  if (
    !seed ||
    seed.status !== "in_progress" ||
    !(await canAccessTeamUpdates(session, seed))
  )
    return;

  const requestedReadThrough = new Date(readThrough);
  if (Number.isNaN(requestedReadThrough.getTime())) return;
  const effectiveReadThrough = new Date(
    Math.min(requestedReadThrough.getTime(), Date.now()),
  );

  await db
    .insert(seedTeamActivityReads)
    .values({
      seedId,
      userId: session.user.id,
      lastReadAt: effectiveReadThrough,
    })
    .onConflictDoUpdate({
      target: [seedTeamActivityReads.seedId, seedTeamActivityReads.userId],
      // An older tab can finish after a newer one; never move the marker back.
      set: {
        lastReadAt: sql`greatest(${seedTeamActivityReads.lastReadAt}, ${effectiveReadThrough})`,
      },
    });

  revalidatePath("/", "layout");
  revalidatePath("/dashboard/sprouts");
}
