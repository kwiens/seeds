import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  adminEmails,
  projectParticipants,
  projects,
  users,
} from "@/lib/db/schema";
import { supportCountSql } from "./projects";

export const USERS_PER_PAGE = 20;

export async function getAllProjects() {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      category: projects.category,
      stage: projects.stage,
      approvalState: projects.approvalState,
      archivedAt: projects.archivedAt,
      badges: projects.badges,
      createdAt: projects.createdAt,
      creatorName: users.name,
      creatorEmail: users.email,
      supportCount: supportCountSql,
    })
    .from(projects)
    .innerJoin(users, eq(projects.createdBy, users.id))
    .orderBy(desc(projects.createdAt));
}

export async function getSupporterEmailsMap() {
  const rows = await db
    .select({ projectId: projectParticipants.projectId, email: users.email })
    .from(projectParticipants)
    .innerJoin(users, eq(projectParticipants.userId, users.id))
    .where(
      and(
        eq(projectParticipants.role, "supporter"),
        eq(projectParticipants.state, "active"),
      ),
    );

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const emails = map.get(row.projectId);
    if (emails) emails.push(row.email);
    else map.set(row.projectId, [row.email]);
  }
  return map;
}

export async function getAdminEmails() {
  return db
    .select({
      id: adminEmails.id,
      email: adminEmails.email,
      addedByName: users.name,
      createdAt: adminEmails.createdAt,
    })
    .from(adminEmails)
    .leftJoin(users, eq(adminEmails.addedBy, users.id))
    .orderBy(desc(adminEmails.createdAt));
}

export async function isDbAdminEmail(email: string): Promise<boolean> {
  const row = await db.query.adminEmails.findFirst({
    where: eq(adminEmails.email, email.toLowerCase()),
    columns: { id: true },
  });
  return !!row;
}

export async function getCouncilMembers() {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.role, "council"))
    .orderBy(desc(users.createdAt));
}

export async function getUsersPage(
  options: { page?: number; search?: string } = {},
) {
  const currentPage =
    Number.isSafeInteger(options.page) && (options.page ?? 0) > 0
      ? (options.page ?? 1)
      : 1;
  const search = options.search?.trim();
  const where = search
    ? or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`))
    : undefined;
  const offset = (currentPage - 1) * USERS_PER_PAGE;

  const [userRows, countResult] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt), desc(users.id))
      .limit(USERS_PER_PAGE)
      .offset(offset),
    db.select({ count: count() }).from(users).where(where),
  ]);
  const totalCount = countResult[0]?.count ?? 0;

  return {
    users: userRows,
    totalCount,
    totalPages: Math.ceil(totalCount / USERS_PER_PAGE),
    currentPage,
    pageSize: USERS_PER_PAGE,
  };
}
