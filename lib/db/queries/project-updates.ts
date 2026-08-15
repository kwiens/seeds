import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectUpdates, users } from "@/lib/db/schema";

export async function getPublicProjectUpdates(projectId: string) {
  return db
    .select({
      id: projectUpdates.id,
      projectId: projectUpdates.projectId,
      title: projectUpdates.title,
      body: projectUpdates.body,
      photos: projectUpdates.photos,
      createdAt: projectUpdates.createdAt,
      updatedAt: projectUpdates.updatedAt,
      authorId: users.id,
      authorName: users.name,
      authorImage: users.image,
    })
    .from(projectUpdates)
    .innerJoin(users, eq(projectUpdates.createdBy, users.id))
    .where(
      and(
        eq(projectUpdates.projectId, projectId),
        eq(projectUpdates.visibility, "public"),
        isNull(projectUpdates.parentId),
      ),
    )
    .orderBy(desc(projectUpdates.createdAt));
}

export type PublicProjectUpdateWithAuthor = Awaited<
  ReturnType<typeof getPublicProjectUpdates>
>[number];

export async function getPublicProjectUpdateById(updateId: string) {
  const rows = await db
    .select({
      id: projectUpdates.id,
      projectId: projectUpdates.projectId,
      title: projectUpdates.title,
      body: projectUpdates.body,
      photos: projectUpdates.photos,
      createdBy: projectUpdates.createdBy,
      createdAt: projectUpdates.createdAt,
      updatedAt: projectUpdates.updatedAt,
      authorName: users.name,
      authorImage: users.image,
    })
    .from(projectUpdates)
    .innerJoin(users, eq(projectUpdates.createdBy, users.id))
    .where(
      and(
        eq(projectUpdates.id, updateId),
        eq(projectUpdates.visibility, "public"),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getTeamProjectUpdates(projectId: string) {
  const rows = await db
    .select({
      id: projectUpdates.id,
      title: projectUpdates.title,
      body: sql<string>`${projectUpdates.body} #>> '{}'`.as("body_text"),
      parentId: projectUpdates.parentId,
      attachments: projectUpdates.attachments,
      createdAt: projectUpdates.createdAt,
      userId: users.id,
      userName: users.name,
      userImage: users.image,
      userRole: users.role,
    })
    .from(projectUpdates)
    .innerJoin(users, eq(projectUpdates.createdBy, users.id))
    .where(
      and(
        eq(projectUpdates.projectId, projectId),
        eq(projectUpdates.visibility, "team"),
      ),
    )
    .orderBy(desc(projectUpdates.createdAt));

  const topLevel: typeof rows = [];
  const repliesByParent = new Map<string, typeof rows>();
  for (const row of rows) {
    if (row.parentId === null) topLevel.push(row);
    else {
      const replies = repliesByParent.get(row.parentId) ?? [];
      replies.push(row);
      repliesByParent.set(row.parentId, replies);
    }
  }

  return topLevel.map((update) => ({
    ...update,
    replies: (repliesByParent.get(update.id) ?? []).sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    ),
  }));
}
