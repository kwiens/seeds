"use server";

import { randomBytes } from "node:crypto";
import { and, eq, isNotNull, isNull, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { canManageProject } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { projectInvites, projectParticipants, projects } from "@/lib/db/schema";
import { hasTeamWorkspace } from "@/lib/project-stages";
import { teamRoleLabels, type TeamRole } from "@/lib/participant-roles";
import { getRequestOrigin } from "@/lib/site-url";
import { createInviteFormSchema } from "@/lib/validations/invite";

function generateToken() {
  return randomBytes(24).toString("base64url");
}

async function getInvitePermissionError(
  session: Session,
  projectId: string,
  role: TeamRole,
) {
  if (role === "steward") {
    return session.user.role === "admin"
      ? null
      : `Only Admins can manage ${teamRoleLabels.steward} invites.`;
  }

  return (await canManageProject(session, { id: projectId }))
    ? null
    : "You do not have permission to manage this project's team.";
}

export async function createInvite(
  projectId: string,
  invitedName: string,
  role: string,
): Promise<{ error: string } | { success: true; link: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const parsed = createInviteFormSchema.safeParse({ invitedName, role });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid invite." };
  }
  const teamRole = parsed.data.role as TeamRole;

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { id: true, stage: true },
  });
  if (!project) return { error: "Project not found." };
  if (!hasTeamWorkspace(project.stage)) {
    return {
      error: "Team invites can be sent once a project becomes a Sprout.",
    };
  }

  const permissionError = await getInvitePermissionError(
    session,
    project.id,
    teamRole,
  );
  if (permissionError) return { error: permissionError };

  const token = generateToken();
  await db.insert(projectInvites).values({
    token,
    projectId,
    role: teamRole,
    invitedName: parsed.data.invitedName,
    createdBy: session.user.id,
  });

  const origin = await getRequestOrigin();

  revalidatePath(`/dashboard/projects/${projectId}/team`);
  return { success: true, link: `${origin}/invite/${token}` };
}

export async function cancelInvite(inviteId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const invite = await db.query.projectInvites.findFirst({
    where: eq(projectInvites.id, inviteId),
  });
  if (!invite) return { error: "Invite not found." };

  const permissionError = await getInvitePermissionError(
    session,
    invite.projectId,
    invite.role as TeamRole,
  );
  if (permissionError) return { error: permissionError };

  const canceledInvites = await db
    .update(projectInvites)
    .set({ canceledAt: new Date() })
    .where(
      and(
        eq(projectInvites.id, inviteId),
        isNull(projectInvites.acceptedAt),
        isNull(projectInvites.canceledAt),
      ),
    )
    .returning({ id: projectInvites.id });

  if (canceledInvites.length === 0) {
    return { error: "This invite is no longer pending." };
  }

  revalidatePath(`/dashboard/projects/${invite.projectId}/team`);
  return { success: true };
}

export async function acceptInvite(token: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const invite = await db.query.projectInvites.findFirst({
    where: eq(projectInvites.token, token),
    with: { project: { columns: { id: true, stage: true } } },
  });
  if (!invite) return { error: "This invite link isn't valid." };
  if (invite.canceledAt) return { error: "This invite has been canceled." };
  if (invite.acceptedAt) {
    return { error: "This invite has already been used." };
  }
  if (!hasTeamWorkspace(invite.project.stage)) {
    return { error: "This project's team workspace is no longer available." };
  }

  const acceptedAt = new Date();
  const displayName = session.user.name ?? invite.invitedName;
  const claimInvite = db
    .update(projectInvites)
    .set({ acceptedAt, acceptedBy: session.user.id })
    .where(
      and(
        eq(projectInvites.id, invite.id),
        isNull(projectInvites.acceptedAt),
        isNull(projectInvites.canceledAt),
      ),
    )
    .returning({ id: projectInvites.id });

  // neon-http cannot run interactive transactions, but its batch API sends
  // these statements as one non-interactive transaction. The second query is
  // tied to this exact claim, so it inserts nothing if another request won.
  const activateParticipant = db
    .insert(projectParticipants)
    .select(
      db
        .select({
          id: sql<string>`gen_random_uuid()`.as("id"),
          projectId: projectInvites.projectId,
          userId: sql<string>`${session.user.id}::uuid`.as("user_id"),
          displayName: sql<string>`${displayName}`.as("display_name"),
          role: projectInvites.role,
          state: sql<"active">`'active'::participant_state`.as("state"),
          addedBy: projectInvites.createdBy,
          createdAt: sql<Date>`now()`.as("created_at"),
          updatedAt: sql<Date>`now()`.as("updated_at"),
        })
        .from(projectInvites)
        .where(
          and(
            eq(projectInvites.id, invite.id),
            eq(projectInvites.acceptedAt, acceptedAt),
            eq(projectInvites.acceptedBy, session.user.id),
          ),
        ),
    )
    .onConflictDoUpdate({
      target: [
        projectParticipants.projectId,
        projectParticipants.userId,
        projectParticipants.role,
      ],
      targetWhere: isNotNull(projectParticipants.userId),
      set: {
        state: "active",
        displayName,
        addedBy: invite.createdBy,
        updatedAt: acceptedAt,
      },
      setWhere: ne(projectParticipants.state, "active"),
    });

  const [claimedInvites] = await db.batch([claimInvite, activateParticipant]);

  if (claimedInvites.length === 0) {
    return { error: "This invite is no longer available." };
  }

  revalidatePath(`/dashboard/projects/${invite.projectId}/team`);
  revalidatePath("/dashboard");
  return {
    success: true,
    projectId: invite.projectId,
  };
}
