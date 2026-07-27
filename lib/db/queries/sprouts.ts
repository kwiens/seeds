import { and, desc, eq, or, sql } from "drizzle-orm";
import type { CategoryKey } from "@/lib/categories";
import { db } from "@/lib/db";
import { seeds, seedTeamMembers } from "@/lib/db/schema";
import type { TeamRole } from "@/lib/team-roles";
import { teamRoleLabels } from "@/lib/team-roles";

export interface MySprout {
  id: string;
  name: string;
  category: CategoryKey;
  lastActivityAt: Date;
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

/**
 * Sprouts (status = "in_progress") the given user has team access to:
 * they created it, they hold a roster row on it (Steward/co-Gardener/
 * Guide/Roots/Cultivator), or they're an Admin (sees every Sprout).
 */
export async function getMySprouts(
  userId: string,
  isAdmin: boolean,
): Promise<MySprout[]> {
  const rows = await db
    .select({
      id: seeds.id,
      name: seeds.name,
      category: seeds.category,
      createdBy: seeds.createdBy,
      teamRole: seedTeamMembers.role,
      lastActivityAt: lastActivitySql,
    })
    .from(seeds)
    .leftJoin(
      seedTeamMembers,
      and(
        eq(seedTeamMembers.seedId, seeds.id),
        eq(seedTeamMembers.userId, userId),
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
    role:
      row.createdBy === userId
        ? "Gardener"
        : row.teamRole
          ? teamRoleLabels[row.teamRole as TeamRole]
          : "Admin",
  }));
}
