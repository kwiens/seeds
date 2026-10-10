import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  or,
  type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
  adminEmails,
  projectParticipants,
  projects,
  users,
} from "@/lib/db/schema";
import type { ProjectStage } from "@/lib/project-stages";
import { activeSupporter, notArchived } from "./filters";
import { supportCountSql } from "./projects";

export const USERS_PER_PAGE = 20;
export const ADMIN_PROJECTS_PER_PAGE = 25;

/** Stage filter values the admin table understands. */
export type AdminProjectStageFilter = ProjectStage | "archived";

const adminProjectStageFilters: AdminProjectStageFilter[] = [
  "seed",
  "sprout",
  "tree",
  "archived",
];

export function isAdminProjectStageFilter(
  value: string | undefined,
): value is AdminProjectStageFilter {
  return adminProjectStageFilters.some((filter) => filter === value);
}

/**
 * One page of the admin project table. Search and the stage filter run in
 * the database so the table stays fast at thousands of projects.
 */
export async function getProjectsPage(
  options: {
    page?: number;
    search?: string;
    stage?: AdminProjectStageFilter;
  } = {},
) {
  const currentPage = toPage(options.page);
  const search = options.search?.trim();
  const conditions: SQL[] = [];
  if (search) conditions.push(ilike(projects.name, `%${search}%`));
  if (options.stage === "archived") {
    conditions.push(isNotNull(projects.archivedAt));
  } else if (options.stage) {
    conditions.push(eq(projects.stage, options.stage), notArchived());
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (currentPage - 1) * ADMIN_PROJECTS_PER_PAGE;

  const [rows, countResult] = await Promise.all([
    db
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
      .where(where)
      .orderBy(desc(projects.createdAt), desc(projects.id))
      .limit(ADMIN_PROJECTS_PER_PAGE)
      .offset(offset),
    db.select({ count: count() }).from(projects).where(where),
  ]);
  const totalCount = countResult[0]?.count ?? 0;

  return {
    projects: rows,
    totalCount,
    totalPages: Math.ceil(totalCount / ADMIN_PROJECTS_PER_PAGE),
    currentPage,
    pageSize: ADMIN_PROJECTS_PER_PAGE,
  };
}

/** Active supporter emails for the given projects only (one table page). */
export async function getSupporterEmailsMap(projectIds: string[]) {
  if (projectIds.length === 0) return new Map<string, string[]>();
  const rows = await db
    .select({ projectId: projectParticipants.projectId, email: users.email })
    .from(projectParticipants)
    .innerJoin(users, eq(projectParticipants.userId, users.id))
    .where(
      and(
        activeSupporter(),
        inArray(projectParticipants.projectId, projectIds),
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

function toPage(value: number | undefined) {
  return Number.isSafeInteger(value) && (value ?? 0) > 0 ? (value ?? 1) : 1;
}

export async function getUsersPage(
  options: { page?: number; search?: string } = {},
) {
  const currentPage = toPage(options.page);
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
