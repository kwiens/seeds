"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { seedApprovals, seeds } from "@/lib/db/schema";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function approveSeed(seedId: string) {
  const session = await requireAdmin();

  await db
    .update(seeds)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(seeds.id, seedId));

  await db.insert(seedApprovals).values({
    seedId,
    approvedBy: session.user.id,
  });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/seeds/${seedId}`);
  return { success: true };
}

export async function archiveSeed(seedId: string) {
  await requireAdmin();

  await db
    .update(seeds)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(seeds.id, seedId));

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

