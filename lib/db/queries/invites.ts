import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectInvites } from "@/lib/db/schema";
import { participantRoleLabels, type TeamRole } from "@/lib/participant-roles";

export interface PendingInvite {
  id: string;
  invitedName: string;
  role: TeamRole;
  roleLabel: string;
  createdAt: Date;
}

export async function getPendingInvites(
  projectId: string,
): Promise<PendingInvite[]> {
  const rows = await db.query.projectInvites.findMany({
    where: and(
      eq(projectInvites.projectId, projectId),
      isNull(projectInvites.acceptedAt),
      isNull(projectInvites.canceledAt),
    ),
    orderBy: desc(projectInvites.createdAt),
  });

  return rows.map((row) => ({
    id: row.id,
    invitedName: row.invitedName,
    role: row.role as TeamRole,
    roleLabel: participantRoleLabels[row.role],
    createdAt: row.createdAt,
  }));
}

export async function getInviteByToken(token: string) {
  const invite = await db.query.projectInvites.findFirst({
    where: eq(projectInvites.token, token),
    with: {
      project: { columns: { id: true, name: true, stage: true } },
    },
  });
  if (!invite) return null;

  return {
    id: invite.id,
    token: invite.token,
    role: invite.role as TeamRole,
    roleLabel: participantRoleLabels[invite.role],
    invitedName: invite.invitedName,
    acceptedAt: invite.acceptedAt,
    canceledAt: invite.canceledAt,
    project: invite.project,
  };
}
