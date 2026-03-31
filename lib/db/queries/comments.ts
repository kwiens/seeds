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

  const topLevel = rows.filter((r) => r.parentId === null);
  const replies = rows.filter((r) => r.parentId !== null);

  return topLevel.map((comment) => ({
    ...comment,
    replies: replies
      .filter((r) => r.parentId === comment.id)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
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
