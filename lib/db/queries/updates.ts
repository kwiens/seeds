import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { seedUpdates, users } from "@/lib/db/schema";

export async function getUpdatesBySeed(seedId: string) {
  return db
    .select({
      id: seedUpdates.id,
      seedId: seedUpdates.seedId,
      title: seedUpdates.title,
      body: seedUpdates.body,
      photos: seedUpdates.photos,
      createdAt: seedUpdates.createdAt,
      updatedAt: seedUpdates.updatedAt,
      authorId: users.id,
      authorName: users.name,
      authorImage: users.image,
    })
    .from(seedUpdates)
    .innerJoin(users, eq(seedUpdates.createdBy, users.id))
    .where(eq(seedUpdates.seedId, seedId))
    .orderBy(desc(seedUpdates.createdAt));
}

export type SeedUpdateWithAuthor = Awaited<
  ReturnType<typeof getUpdatesBySeed>
>[number];

export async function getUpdateById(updateId: string) {
  const rows = await db
    .select({
      id: seedUpdates.id,
      seedId: seedUpdates.seedId,
      title: seedUpdates.title,
      body: seedUpdates.body,
      photos: seedUpdates.photos,
      createdBy: seedUpdates.createdBy,
      createdAt: seedUpdates.createdAt,
      updatedAt: seedUpdates.updatedAt,
      authorName: users.name,
      authorImage: users.image,
    })
    .from(seedUpdates)
    .innerJoin(users, eq(seedUpdates.createdBy, users.id))
    .where(eq(seedUpdates.id, updateId))
    .limit(1);

  return rows[0] ?? null;
}
