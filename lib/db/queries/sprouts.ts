import { and, desc, eq, sql } from "drizzle-orm";
import type { CategoryKey } from "@/lib/categories";
import { db } from "@/lib/db";
import { seeds } from "@/lib/db/schema";

export interface MySprout {
  id: string;
  name: string;
  category: CategoryKey;
  lastActivityAt: Date;
  role: "Gardener" | "Admin";
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
 * Sprouts (status = "in_progress") the given user has team access to.
 * Admins see every Sprout; everyone else sees Sprouts they created.
 * Once the team roster exists (Group B), this also includes Sprouts
 * where the user holds a roster row (Steward/Guide/Roots/Cultivator).
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
      lastActivityAt: lastActivitySql,
    })
    .from(seeds)
    .where(
      isAdmin
        ? eq(seeds.status, "in_progress")
        : and(eq(seeds.status, "in_progress"), eq(seeds.createdBy, userId)),
    )
    .orderBy(desc(lastActivitySql));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    lastActivityAt: new Date(row.lastActivityAt),
    role: row.createdBy === userId ? "Gardener" : "Admin",
  }));
}
