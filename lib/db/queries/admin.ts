import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { seeds, users } from "@/lib/db/schema";
import { supportCountSql } from "./seeds";

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
      supportCount: supportCountSql,
    })
    .from(seeds)
    .innerJoin(users, eq(seeds.createdBy, users.id))
    .orderBy(desc(seeds.createdAt));
}
