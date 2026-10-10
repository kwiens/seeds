"use server";

import { and, eq, ilike, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { badgeKeys, type BadgeKey } from "@/config/badges";
import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import {
  BANNER_CACHE_TAG,
  BANNER_SETTING_KEYS,
  HARVEST_FEST_CACHE_TAG,
  HARVEST_FEST_SETTING_KEY,
  HOMEPAGE_PHASE_CACHE_TAG,
  HOMEPAGE_PHASE_SETTING_KEY,
  type HarvestFestPage,
} from "@/lib/db/queries/settings";
import { projectApprovals, projects, siteSettings } from "@/lib/db/schema";
import type { ApprovalState, ProjectStage } from "@/lib/project-stages";
import { revalidateProject } from "@/lib/revalidate";
import { routes } from "@/lib/routes";
import {
  formatHarvestFestIssue,
  harvestFestPageSchema,
} from "@/lib/validations/harvest-fest";
import { bannerConfigSchema } from "@/lib/validations/site-banner";
import { firstIssue } from "./result";

/** Admin-only patch of top-level project fields. */
async function setProjectFields(
  projectId: string,
  fields: Partial<{
    stage: ProjectStage;
    approvalState: ApprovalState;
    archivedAt: Date | null;
    badges: BadgeKey[];
  }>,
) {
  await requireAdmin();
  await db
    .update(projects)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(projects.id, projectId));
  revalidateProject(projectId);
  return { success: true };
}

export async function approveProject(projectId: string) {
  const session = await requireAdmin();

  await db.batch([
    db
      .update(projects)
      .set({ approvalState: "approved", updatedAt: new Date() })
      .where(eq(projects.id, projectId)),
    db.insert(projectApprovals).values({
      projectId,
      approvedBy: session.user.id,
    }),
  ]);

  revalidateProject(projectId);
  return { success: true };
}

export async function archiveProject(projectId: string) {
  return setProjectFields(projectId, { archivedAt: new Date() });
}

export async function unarchiveProject(projectId: string) {
  return setProjectFields(projectId, { archivedAt: null });
}

export async function unapproveProject(projectId: string) {
  return setProjectFields(projectId, { approvalState: "pending" });
}

export async function advanceToSprout(projectId: string) {
  return setProjectFields(projectId, { stage: "sprout" });
}

export async function advanceToTree(projectId: string) {
  return setProjectFields(projectId, { stage: "tree" });
}

export async function revertToSeed(projectId: string) {
  return setProjectFields(projectId, { stage: "seed" });
}

export async function revertToSprout(projectId: string) {
  return setProjectFields(projectId, { stage: "sprout" });
}

export async function setProjectBadges(projectId: string, badges: BadgeKey[]) {
  // Defensive re-check against the known keys — the client-side toggle uses
  // the same source of truth, but we don't trust the wire.
  const cleaned = badges.filter((b): b is BadgeKey =>
    (badgeKeys as string[]).includes(b),
  );
  return setProjectFields(projectId, { badges: cleaned });
}

export async function setBannerConfig(input: {
  enabled: boolean;
  message: string;
  href: string;
}) {
  await requireAdmin();

  const parsed = bannerConfigSchema.safeParse({
    enabled: input.enabled,
    message: input.message.trim(),
    href: input.href.trim(),
  });
  if (!parsed.success) {
    return {
      success: false as const,
      error: firstIssue(parsed, "Invalid banner config"),
    };
  }

  const { enabled, message, href } = parsed.data;
  const now = new Date();

  // Single multi-row upsert — all three keys land together or not at all,
  // avoiding a partial state like "enabled flipped but message unchanged".
  await db
    .insert(siteSettings)
    .values([
      {
        key: BANNER_SETTING_KEYS.enabled,
        value: enabled ? "true" : "false",
        updatedAt: now,
      },
      { key: BANNER_SETTING_KEYS.message, value: message, updatedAt: now },
      { key: BANNER_SETTING_KEYS.href, value: href, updatedAt: now },
    ])
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        value: sql`excluded.value`,
        updatedAt: sql`excluded.updated_at`,
      },
    });

  updateTag(BANNER_CACHE_TAG);
  return { success: true as const };
}

export async function setHomepagePhase(phase: 1 | 2) {
  await requireAdmin();

  await db
    .insert(siteSettings)
    .values({
      key: HOMEPAGE_PHASE_SETTING_KEY,
      value: String(phase),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: String(phase), updatedAt: new Date() },
    });

  updateTag(HOMEPAGE_PHASE_CACHE_TAG);
  revalidatePath(routes.home);
  revalidatePath(routes.admin);
  return { success: true };
}

export async function setHarvestFestPage(input: HarvestFestPage) {
  await requireAdmin();

  const parsed = harvestFestPageSchema.safeParse({
    title: input.title,
    tagline: input.tagline,
    intro: input.intro,
    events: input.events.map((event) => ({
      date: event.date,
      time: event.time,
      title: event.title,
      location: event.location,
      description: event.description,
      details: event.details || undefined,
      imageUrls: event.imageUrls?.length ? event.imageUrls : undefined,
      projectId: event.projectId || undefined,
      projectName: event.projectName || undefined,
    })),
  });
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]
        ? formatHarvestFestIssue(parsed.error.issues[0])
        : "Invalid Harvest Fest page",
    };
  }

  await db
    .insert(siteSettings)
    .values({
      key: HARVEST_FEST_SETTING_KEY,
      value: JSON.stringify(parsed.data),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: sql`excluded.value`, updatedAt: sql`excluded.updated_at` },
    });

  updateTag(HARVEST_FEST_CACHE_TAG);
  revalidatePath(routes.harvestFest);
  return { success: true as const };
}

export async function searchProjectsForHarvestFest(query: string) {
  await requireAdmin();

  const trimmed = query.trim();
  if (!trimmed) return [];

  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      stage: projects.stage,
    })
    .from(projects)
    .where(
      and(
        ilike(projects.name, `%${trimmed}%`),
        isNull(projects.archivedAt),
        // Harvest Fest traces an event back to where it sprouted from --
        // Trees are the established end state, not a thing something grows
        // "from", so they're excluded here even though they're still valid
        // elsewhere in the project lifecycle.
        inArray(projects.stage, ["seed", "sprout"]),
      ),
    )
    .orderBy(projects.name)
    .limit(8);

  return rows;
}
