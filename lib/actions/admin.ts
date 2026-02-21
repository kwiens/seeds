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

async function updateSeedStatus(
  seedId: string,
  status: "pending" | "approved" | "archived",
  extraPaths: string[] = [],
) {
  await requireAdmin();

  await db
    .update(seeds)
    .set({ status, updatedAt: new Date() })
    .where(eq(seeds.id, seedId));

  revalidatePath("/admin");
  revalidatePath("/");
  for (const p of extraPaths) revalidatePath(p);
  return { success: true };
}

export async function approveSeed(seedId: string) {
  const session = await requireAdmin();

  await db.batch([
    db
      .update(seeds)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(seeds.id, seedId)),
    db.insert(seedApprovals).values({
      seedId,
      approvedBy: session.user.id,
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/seeds/${seedId}`);
  return { success: true };
}

export async function archiveSeed(seedId: string) {
  return updateSeedStatus(seedId, "archived");
}

export async function unarchiveSeed(seedId: string) {
  return updateSeedStatus(seedId, "pending");
}

export async function unapproveSeed(seedId: string) {
  return updateSeedStatus(seedId, "pending", [`/seeds/${seedId}`]);
}
