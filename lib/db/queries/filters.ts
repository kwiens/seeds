import { and, eq, isNull, ne, type SQL } from "drizzle-orm";
import { projectParticipants, projects } from "@/lib/db/schema";

/**
 * Reusable `where` fragments for the access rules that recur across queries,
 * actions and exports. Compose them with `and(...)`.
 */

/** Projects that have not been archived. */
export const notArchived = (): SQL => isNull(projects.archivedAt);

/**
 * Projects visible to anyone. Pending projects are deliberately public so
 * organizers can share them for feedback; only drafts and archived projects
 * are hidden. Mirrors `getReadableProject` in lib/project-read-access.ts.
 */
export const publicProject = (): SQL =>
  and(ne(projects.approvalState, "draft"), notArchived()) as SQL;

/** Projects search engines may index: approved and not archived. */
export const indexableProject = (): SQL =>
  and(eq(projects.approvalState, "approved"), notArchived()) as SQL;

/** Participant rows that count as an active supporter. */
export function activeSupporter(scope?: {
  projectId?: string;
  userId?: string;
}): SQL {
  const conditions: SQL[] = [
    eq(projectParticipants.role, "supporter"),
    eq(projectParticipants.state, "active"),
  ];
  if (scope?.projectId) {
    conditions.push(eq(projectParticipants.projectId, scope.projectId));
  }
  if (scope?.userId) {
    conditions.push(eq(projectParticipants.userId, scope.userId));
  }
  return and(...conditions) as SQL;
}

/** Participant rows for active team members (any role except supporter). */
export function activeTeamMember(projectId?: string): SQL {
  const conditions: SQL[] = [
    ne(projectParticipants.role, "supporter"),
    eq(projectParticipants.state, "active"),
  ];
  if (projectId) {
    conditions.push(eq(projectParticipants.projectId, projectId));
  }
  return and(...conditions) as SQL;
}
