import { and, desc, eq, isNull, count } from "drizzle-orm";
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

export const ADMIN_COMMENTS_PER_PAGE = 50;

/** One page of every comment, newest first, for the admin moderation tab. */
export async function getCommentsPage(options: { page?: number } = {}) {
  const currentPage =
    Number.isSafeInteger(options.page) && (options.page ?? 0) > 0
      ? (options.page ?? 1)
      : 1;
  const offset = (currentPage - 1) * ADMIN_COMMENTS_PER_PAGE;

  const [rows, countResult] = await Promise.all([
    db
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
      .orderBy(desc(projectComments.createdAt), desc(projectComments.id))
      .limit(ADMIN_COMMENTS_PER_PAGE)
      .offset(offset),
    db.select({ count: count() }).from(projectComments),
  ]);
  const totalCount = countResult[0]?.count ?? 0;

  return {
    comments: rows,
    totalCount,
    totalPages: Math.ceil(totalCount / ADMIN_COMMENTS_PER_PAGE),
    currentPage,
    pageSize: ADMIN_COMMENTS_PER_PAGE,
  };
}
