import { desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { seeds, users } from "@/lib/db/schema";

export async function getAllSeeds() {
  return db
    .select({
      id: seeds.id,
      name: seeds.name,
      category: seeds.category,
      status: seeds.status,
      createdAt: seeds.createdAt,
      creatorName: users.name,
      creatorEmail: users.email,
      supportCount: sql<number>`(
        select count(*) from seed_supports
        where seed_supports.seed_id = seeds.id
      )`.as("support_count"),
    })
    .from(seeds)
    .innerJoin(users, sql`${seeds.createdBy} = ${users.id}`)
    .orderBy(desc(seeds.createdAt));
}
