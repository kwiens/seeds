"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { seedApprovals, seeds, siteSettings } from "@/lib/db/schema";
import { badgeKeys, type BadgeKey } from "@/lib/badges";

const STATUS_LISTING_PATHS = [
  "/status/seeds",
  "/status/sprouts",
  "/status/trees",
];

function revalidateSeedStatusPaths(seedId: string) {
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/seeds/${seedId}`);
  for (const p of STATUS_LISTING_PATHS) revalidatePath(p);
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

async function updateSeedStatus(
  seedId: string,
  status:
    | "pending"
    | "approved"
    | "in_progress"
    | "in_maintenance"
    | "archived",
) {
  await requireAdmin();

  await db
    .update(seeds)
    .set({ status, updatedAt: new Date() })
    .where(eq(seeds.id, seedId));

  revalidateSeedStatusPaths(seedId);
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

  revalidateSeedStatusPaths(seedId);
  return { success: true };
}

export async function archiveSeed(seedId: string) {
  await requireAdmin();

  // Archive only from the seed stage (pending/approved). Otherwise unarchiving
  // would silently demote a sprout/tree back to pending — admin must revert
  // through the lifecycle first.
  const current = await db.query.seeds.findFirst({
    where: eq(seeds.id, seedId),
    columns: { status: true },
  });
  if (current?.status !== "pending" && current?.status !== "approved") {
    throw new Error(
      "Seeds in progress or maintenance must be reverted to Seed before archiving",
    );
  }

  await db
    .update(seeds)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(seeds.id, seedId));

  revalidateSeedStatusPaths(seedId);
  return { success: true };
}

export async function unarchiveSeed(seedId: string) {
  return updateSeedStatus(seedId, "pending");
}

export async function unapproveSeed(seedId: string) {
  return updateSeedStatus(seedId, "pending");
}

export async function advanceToInProgress(seedId: string) {
  return updateSeedStatus(seedId, "in_progress");
}

export async function advanceToMaintenance(seedId: string) {
  return updateSeedStatus(seedId, "in_maintenance");
}

export async function revertToApproved(seedId: string) {
  return updateSeedStatus(seedId, "approved");
}

export async function revertToInProgress(seedId: string) {
  return updateSeedStatus(seedId, "in_progress");
}

export async function setSeedBadges(seedId: string, badges: BadgeKey[]) {
  await requireAdmin();

  // Defensive re-check against the known keys — the client-side toggle uses
  // the same source of truth, but we don't trust the wire.
  const cleaned = badges.filter((b): b is BadgeKey =>
    (badgeKeys as string[]).includes(b),
  );

  await db
    .update(seeds)
    .set({ badges: cleaned, updatedAt: new Date() })
    .where(eq(seeds.id, seedId));

  revalidateSeedStatusPaths(seedId);
  return { success: true };
}

export async function setHomepagePhase(phase: 1 | 2) {
  await requireAdmin();

  await db
    .insert(siteSettings)
    .values({
      key: "homepage_phase",
      value: String(phase),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: String(phase), updatedAt: new Date() },
    });

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}
