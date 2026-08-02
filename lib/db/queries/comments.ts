import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectComments, projects, users } from "@/lib/db/schema";

export async function getCommentsByProject(projectId: string) {
  const rows = await db
    .select({
      id: projectComments.id,
      content: projectComments.content,
      parentId: projectComments.parentId,
      createdAt: projectComments.createdAt,
      userId: users.id,
      userName: users.name,
      userImage: users.image,
    })
    .from(projectComments)
    .innerJoin(users, eq(projectComments.userId, users.id))
    .where(
      and(
        eq(projectComments.projectId, projectId),
        isNull(projectComments.archivedAt),
      ),
    )
    .orderBy(desc(projectComments.createdAt));

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
      id: projectComments.id,
      content: projectComments.content,
      parentId: projectComments.parentId,
      createdAt: projectComments.createdAt,
      archivedAt: projectComments.archivedAt,
      projectId: projects.id,
      projectName: projects.name,
      userName: users.name,
    })
    .from(projectComments)
    .innerJoin(users, eq(projectComments.userId, users.id))
    .innerJoin(projects, eq(projectComments.projectId, projects.id))
    .orderBy(desc(projectComments.createdAt));
}
