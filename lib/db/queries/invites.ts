import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectInvites } from "@/lib/db/schema";
import { participantRoleLabels, type TeamRole } from "@/lib/participant-roles";

export interface PendingInvite {
  id: string;
  invitedName: string;
  roleLabel: string;
  createdAt: Date;
  link: string | null;
}

export async function getPendingInvites(
  projectId: string,
  access: { canManage: boolean; isAdmin: boolean },
): Promise<PendingInvite[]> {
  const rows = await db.query.projectInvites.findMany({
    where: and(
      eq(projectInvites.projectId, projectId),
      isNull(projectInvites.acceptedAt),
      isNull(projectInvites.canceledAt),
    ),
    columns: {
      id: true,
      token: true,
      invitedName: true,
      role: true,
      createdAt: true,
    },
    orderBy: desc(projectInvites.createdAt),
  });

  return rows.map((row) => {
    const canManageInvite =
      row.role === "steward" ? access.isAdmin : access.canManage;

    return {
      id: row.id,
      invitedName: row.invitedName,
      roleLabel: participantRoleLabels[row.role],
      createdAt: row.createdAt,
      link: canManageInvite ? `/invite/${row.token}` : null,
    };
  });
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
