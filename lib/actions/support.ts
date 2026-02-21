"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { seedSupports } from "@/lib/db/schema";

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

  if (existing) {
    await db
      .delete(seedSupports)
      .where(eq(seedSupports.id, existing.id));
  } else {
    await db.insert(seedSupports).values({
      seedId,
      userId: session.user.id,
    });
  }

  revalidatePath(`/seeds/${seedId}`);
  revalidatePath("/");
  return { success: true };
}
