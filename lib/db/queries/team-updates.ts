import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { seedTeamUpdates, users } from "@/lib/db/schema";

export async function getTeamUpdatesBySeed(seedId: string) {
  const rows = await db
    .select({
      id: seedTeamUpdates.id,
      title: seedTeamUpdates.title,
      body: seedTeamUpdates.body,
      parentId: seedTeamUpdates.parentId,
      createdAt: seedTeamUpdates.createdAt,
      userId: users.id,
      userName: users.name,
      userImage: users.image,
    })
    .from(seedTeamUpdates)
    .innerJoin(users, eq(seedTeamUpdates.userId, users.id))
    .where(eq(seedTeamUpdates.seedId, seedId))
    .orderBy(desc(seedTeamUpdates.createdAt));

  const topLevel: typeof rows = [];
  const repliesByParent = new Map<string, typeof rows>();

  for (const row of rows) {
    if (row.parentId === null) {
      topLevel.push(row);
    } else {
      const list = repliesByParent.get(row.parentId) ?? [];
      list.push(row);
      repliesByParent.set(row.parentId, list);
    }
  }

  return topLevel.map((update) => ({
    ...update,
    replies: (repliesByParent.get(update.id) ?? []).sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    ),
  }));
}
