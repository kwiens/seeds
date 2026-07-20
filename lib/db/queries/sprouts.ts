import { and, desc, eq } from "drizzle-orm";
import type { CategoryKey } from "@/lib/categories";
import { db } from "@/lib/db";
import { seeds } from "@/lib/db/schema";

export interface MySprout {
  id: string;
  name: string;
  category: CategoryKey;
  updatedAt: Date;
  role: "Gardener" | "Admin";
}

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
      updatedAt: seeds.updatedAt,
      createdBy: seeds.createdBy,
    })
    .from(seeds)
    .where(
      isAdmin
        ? eq(seeds.status, "in_progress")
        : and(eq(seeds.status, "in_progress"), eq(seeds.createdBy, userId)),
    )
    .orderBy(desc(seeds.updatedAt));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    updatedAt: row.updatedAt,
    role: row.createdBy === userId ? "Gardener" : "Admin",
  }));
}
