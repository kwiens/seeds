"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { seedTeamActivityReads } from "@/lib/db/schema";

export async function markSproutActivityRead(seedId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  await db
    .insert(seedTeamActivityReads)
    .values({ seedId, userId: session.user.id, lastReadAt: new Date() })
    .onConflictDoUpdate({
      target: [seedTeamActivityReads.seedId, seedTeamActivityReads.userId],
      set: { lastReadAt: new Date() },
    });

  revalidatePath("/", "layout");
  revalidatePath("/dashboard/sprouts");
}
