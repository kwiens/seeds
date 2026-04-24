"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { seeds, seedSupports } from "@/lib/db/schema";

const AUTO_PROMOTE_THRESHOLD = 10;

export async function toggleSupport(seedId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to support a seed." };
  }

  const existing = await db.query.seedSupports.findFirst({
    where: and(
      eq(seedSupports.seedId, seedId),
      eq(seedSupports.userId, session.user.id),
    ),
  });

  let promoted = false;
  try {
    if (existing) {
      await db.delete(seedSupports).where(eq(seedSupports.id, existing.id));
    } else {
      await db.insert(seedSupports).values({
        seedId,
        userId: session.user.id,
      });

      promoted = await autoPromoteIfEligible(seedId);
    }
  } catch {
    // Unique constraint violation from concurrent double-click — treat as no-op
  }

  revalidatePath(`/seeds/${seedId}`);
  revalidatePath("/");
  if (promoted) {
    revalidatePath("/admin");
    revalidatePath("/status/seeds");
  }
  return { success: true };
}

// Single conditional UPDATE: atomically promotes iff still pending AND
// supporter count has reached the threshold. Returns whether a promotion fired.
async function autoPromoteIfEligible(seedId: string) {
  const updated = await db
    .update(seeds)
    .set({ status: "approved", updatedAt: new Date() })
    .where(
      and(
        eq(seeds.id, seedId),
        eq(seeds.status, "pending"),
        sql`(SELECT COUNT(*) FROM ${seedSupports} WHERE ${seedSupports.seedId} = ${seedId}) >= ${AUTO_PROMOTE_THRESHOLD}`,
      ),
    )
    .returning({ id: seeds.id });

  return updated.length > 0;
}
