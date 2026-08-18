import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  adminEmails,
  projectParticipants,
  projects,
  users,
} from "@/lib/db/schema";
import { supportCountSql } from "./projects";

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

export async function getAllUsers() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
}
