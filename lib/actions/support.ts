"use server";

import { and, count, eq } from "drizzle-orm";
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

  try {
    if (existing) {
      await db.delete(seedSupports).where(eq(seedSupports.id, existing.id));
    } else {
      await db.insert(seedSupports).values({
        seedId,
        userId: session.user.id,
      });

      // Auto-promote pending seeds to approved once they reach the threshold
      await autoPromoteIfEligible(seedId);
    }
  } catch {
    // Unique constraint violation from concurrent double-click — treat as no-op
  }

  revalidatePath(`/seeds/${seedId}`);
  revalidatePath("/");
  return { success: true };
}

async function autoPromoteIfEligible(seedId: string) {
  const seed = await db.query.seeds.findFirst({
    where: eq(seeds.id, seedId),
    columns: { status: true },
  });

  if (seed?.status !== "pending") return;

  const [result] = await db
    .select({ count: count() })
    .from(seedSupports)
    .where(eq(seedSupports.seedId, seedId));

  if ((result?.count ?? 0) >= AUTO_PROMOTE_THRESHOLD) {
    await db
      .update(seeds)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(seeds.id, seedId));
  }
}
