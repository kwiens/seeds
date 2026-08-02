import { and, desc, eq, or, sql } from "drizzle-orm";
import type { CategoryKey } from "@/lib/categories";
import { db } from "@/lib/db";
import { seeds, seedTeamActivityReads, seedTeamMembers } from "@/lib/db/schema";
import type { TeamRole } from "@/lib/team-roles";
import { teamRoleLabels } from "@/lib/team-roles";

export interface MySprout {
  id: string;
  name: string;
  category: CategoryKey;
  lastActivityAt: Date;
  unreadCount: number;
  role: string;
}

// The most recent of: the seed's own last edit, or its latest Team Update.
// Posting a Team Update never touches seeds.updated_at, so without this a
// Sprout with a very active conversation would still look stale in the list.
const lastActivitySql = sql<string>`greatest(
  ${seeds.updatedAt},
  coalesce(
    (select max(created_at) from seed_team_updates where seed_team_updates.seed_id = seeds.id),
    ${seeds.updatedAt}
  )
)`.as("last_activity");

// Team Updates posted since this viewer's own last visit to this Sprout's
// Team page. Deliberately scoped to Team Updates only (not seeds.updated_at)
// -- editing the seed's photo shouldn't flag "new activity" for the team.
function unreadCountSql(userId: string) {
  return sql<number>`(
    select count(*)::int from seed_team_updates
    where seed_team_updates.seed_id = seeds.id
    and seed_team_updates.user_id <> ${userId}
    and seed_team_updates.created_at > coalesce(${seedTeamActivityReads.lastReadAt}, to_timestamp(0))
  )`.as("unread_count");
}

/**
 * Sprouts (status = "in_progress") the given user has team access to:
 * they created it, they hold a roster row on it (Steward/co-Gardener/
 * Guide/Roots/Cultivator), or they're an Admin (sees every Sprout).
 */
export async function getMySprouts(
  userId: string,
  isAdmin: boolean,
): Promise<MySprout[]> {
  const unreadCount = unreadCountSql(userId);
  const rows = await db
    .select({
      id: seeds.id,
      name: seeds.name,
      category: seeds.category,
      createdBy: seeds.createdBy,
      teamRole: seedTeamMembers.role,
      lastActivityAt: lastActivitySql,
      unreadCount,
    })
    .from(seeds)
    .leftJoin(
      seedTeamMembers,
      and(
        eq(seedTeamMembers.seedId, seeds.id),
        eq(seedTeamMembers.userId, userId),
      ),
    )
    .leftJoin(
      seedTeamActivityReads,
      and(
        eq(seedTeamActivityReads.seedId, seeds.id),
        eq(seedTeamActivityReads.userId, userId),
      ),
    )
    .where(
      isAdmin
        ? eq(seeds.status, "in_progress")
        : and(
            eq(seeds.status, "in_progress"),
            or(
              eq(seeds.createdBy, userId),
              sql`${seedTeamMembers.id} is not null`,
            ),
          ),
    )
    .orderBy(desc(lastActivitySql));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    lastActivityAt: new Date(row.lastActivityAt),
    unreadCount: row.unreadCount,
    role:
      row.createdBy === userId
        ? "Gardener"
        : row.teamRole
          ? teamRoleLabels[row.teamRole as TeamRole]
          : "Admin",
  }));
}
