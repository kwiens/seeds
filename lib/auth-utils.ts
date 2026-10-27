import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectParticipants } from "@/lib/db/schema";
import { managementRoles, teamAccessRoles } from "@/lib/participant-roles";
import {
  isAdmin,
  isSignedIn,
  type SessionLike as Session,
} from "@/lib/session";

/**
 * Per-project capability checks backed by the participants table. These are
 * the primitives; `lib/project-access.ts` composes them with the stage and
 * archive rules and is what pages and actions should call.
 */

export async function canManageProject(
  session: Session,
  project: { id: string },
): Promise<boolean> {
  if (!isSignedIn(session)) return false;
  if (isAdmin(session)) return true;

  const leadership = await db.query.projectParticipants.findFirst({
    where: and(
      eq(projectParticipants.projectId, project.id),
      eq(projectParticipants.userId, session.user.id),
      inArray(projectParticipants.role, managementRoles),
      eq(projectParticipants.state, "active"),
    ),
    columns: { id: true },
  });
  return !!leadership;
}

export async function canAccessTeamWorkspace(
  session: Session,
  project: { id: string },
): Promise<boolean> {
  if (!isSignedIn(session)) return false;
  if (isAdmin(session) || session.user.role === "council") return true;

  const participation = await db.query.projectParticipants.findFirst({
    where: and(
      eq(projectParticipants.projectId, project.id),
      eq(projectParticipants.userId, session.user.id),
      inArray(projectParticipants.role, teamAccessRoles),
      eq(projectParticipants.state, "active"),
    ),
    columns: { id: true },
  });
  return !!participation;
}
