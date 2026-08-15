import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectParticipants } from "@/lib/db/schema";
import { teamAccessRoles } from "@/lib/participant-roles";

type Session = { user: { id: string; role: string } } | null | undefined;

export async function canManageProject(
  session: Session,
  project: { id: string },
): Promise<boolean> {
  if (!session?.user?.id) return false;
  if (session.user.role === "admin") return true;

  const leadership = await db.query.projectParticipants.findFirst({
    where: and(
      eq(projectParticipants.projectId, project.id),
      eq(projectParticipants.userId, session.user.id),
      inArray(projectParticipants.role, ["gardener", "co_gardener"]),
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
  if (!session?.user?.id) return false;
  if (session.user.role === "admin" || session.user.role === "council") {
    return true;
  }

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
