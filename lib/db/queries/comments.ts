import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { seedComments, seeds, users } from "@/lib/db/schema";

export async function getCommentsBySeed(seedId: string) {
  const rows = await db
    .select({
      id: seedComments.id,
      content: seedComments.content,
      parentId: seedComments.parentId,
      createdAt: seedComments.createdAt,
      userId: users.id,
      userName: users.name,
      userImage: users.image,
    })
    .from(seedComments)
    .innerJoin(users, eq(seedComments.userId, users.id))
    .where(
      and(eq(seedComments.seedId, seedId), isNull(seedComments.archivedAt)),
    )
    .orderBy(desc(seedComments.createdAt));

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

  return topLevel.map((comment) => ({
    ...comment,
    replies: (repliesByParent.get(comment.id) ?? []).sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    ),
  }));
}

export async function getAllComments() {
  return db
    .select({
      id: seedComments.id,
      content: seedComments.content,
      parentId: seedComments.parentId,
      createdAt: seedComments.createdAt,
      archivedAt: seedComments.archivedAt,
      seedId: seeds.id,
      seedName: seeds.name,
      userName: users.name,
    })
    .from(seedComments)
    .innerJoin(users, eq(seedComments.userId, users.id))
    .innerJoin(seeds, eq(seedComments.seedId, seeds.id))
    .orderBy(desc(seedComments.createdAt));
}
