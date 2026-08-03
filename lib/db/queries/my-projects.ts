import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { CategoryKey } from "@/lib/categories";
import { db } from "@/lib/db";
import { projectActivityReads, projects } from "@/lib/db/schema";
import {
  participantRoleLabels,
  teamAccessRoles,
  type ParticipantRole,
} from "@/lib/participant-roles";
import type { ProjectStage } from "@/lib/project-stages";

export interface MyProject {
  id: string;
  name: string;
  category: CategoryKey;
  stage: ProjectStage;
  lastActivityAt: Date;
  unreadCount: number;
  role: string;
}

export function hasSitewideMyProjectsAccess(viewerRole: string): boolean {
  return viewerRole === "council";
}

const lastActivitySql = sql<string>`greatest(
  ${projects.updatedAt},
  coalesce((select max(updated_at) from project_updates where project_id = projects.id), ${projects.updatedAt}),
  coalesce((select max(updated_at) from project_budgets where project_id = projects.id), ${projects.updatedAt}),
  coalesce((select max(updated_at) from project_events where project_id = projects.id), ${projects.updatedAt}),
  coalesce((select max(updated_at) from project_participants where project_id = projects.id), ${projects.updatedAt})
)`.as("last_activity");

const teamAccessRolesSql = sql`array[${sql.join(
  teamAccessRoles.map((role) => sql`${role}::participant_role`),
  sql`, `,
)}]`;

function unreadCountSql(userId: string) {
  return sql<number>`(
    select count(*)::int from project_updates
    where project_updates.project_id = projects.id
      and project_updates.visibility = 'team'
      and project_updates.created_by <> ${userId}
      and project_updates.created_at > coalesce(${projectActivityReads.lastReadAt}, to_timestamp(0))
  )`.as("unread_count");
}

function viewerRoleSql(userId: string) {
  return sql<ParticipantRole | null>`(
    select role from project_participants
    where project_id = projects.id
      and user_id = ${userId}
      and state = 'active'
      and role = any(${teamAccessRolesSql})
    order by case role when 'gardener' then 0 when 'co_gardener' then 1 else 2 end
    limit 1
  )`.as("participant_role");
}

export async function getMyProjects(
  userId: string,
  viewerRole: string,
): Promise<MyProject[]> {
  const seesAll = hasSitewideMyProjectsAccess(viewerRole);
  const unreadCount = unreadCountSql(userId);
  const participantRole = viewerRoleSql(userId);
  const accessExists = sql`exists (
    select 1 from project_participants
    where project_id = projects.id
      and user_id = ${userId}
      and state = 'active'
      and role = any(${teamAccessRolesSql})
  )`;

  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      category: projects.category,
      stage: projects.stage,
      participantRole,
      lastActivityAt: lastActivitySql,
      unreadCount,
    })
    .from(projects)
    .leftJoin(
      projectActivityReads,
      and(
        eq(projectActivityReads.projectId, projects.id),
        eq(projectActivityReads.userId, userId),
        eq(projectActivityReads.visibility, "team"),
      ),
    )
    .where(
      and(
        inArray(projects.stage, ["sprout", "tree"]),
        isNull(projects.archivedAt),
        seesAll ? undefined : accessExists,
      ),
    )
    .orderBy(desc(lastActivitySql));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    stage: row.stage,
    lastActivityAt: new Date(row.lastActivityAt),
    unreadCount: row.unreadCount,
    role: row.participantRole
      ? participantRoleLabels[row.participantRole]
      : viewerRole === "admin"
        ? "Admin"
        : "Council",
  }));
}
