import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectParticipants } from "@/lib/db/schema";
import { participantRoleLabels } from "@/lib/participant-roles";

export interface RosterMember {
  userId: string;
  name: string;
  image: string | null;
  roleLabels: string[];
  addedByName: string | null;
  joinedAt: Date;
}

export async function getTeamMembers(
  projectId: string,
): Promise<RosterMember[]> {
  const rows = await db.query.projectParticipants.findMany({
    where: and(
      eq(projectParticipants.projectId, projectId),
      eq(projectParticipants.state, "active"),
      ne(projectParticipants.role, "supporter"),
    ),
    with: {
      user: { columns: { id: true, name: true, image: true } },
      addedByUser: { columns: { name: true } },
    },
    orderBy: asc(projectParticipants.createdAt),
  });

  const members = new Map<string, RosterMember>();
  for (const row of rows) {
    if (!row.user) continue;
    const existing = members.get(row.user.id);
    const roleLabel = participantRoleLabels[row.role];
    if (existing) {
      if (!existing.roleLabels.includes(roleLabel))
        existing.roleLabels.push(roleLabel);
      continue;
    }
    members.set(row.user.id, {
      userId: row.user.id,
      name: row.user.name,
      image: row.user.image,
      roleLabels: [roleLabel],
      addedByName: row.addedByUser?.name ?? null,
      joinedAt: row.createdAt,
    });
  }
  return [...members.values()];
}
