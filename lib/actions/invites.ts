"use server";

import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
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
    columns: { id: true, stage: true, name: true },
  });
  if (!project) return { error: "Project not found." };
  if (!hasTeamWorkspace(project.stage)) {
    return {
      error: "Team invites can be sent once a project becomes a Sprout.",
    };
  }

  if (teamRole === "steward") {
    if (session.user.role !== "admin") {
      return { error: `Only Admins can invite a ${teamRoleLabels.steward}.` };
    }
  } else if (!(await canManageProject(session, project))) {
    return {
      error: "You do not have permission to manage this project's team.",
    };
  }

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

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, invite.projectId),
    columns: { id: true },
  });
  if (!project) return { error: "Project not found." };

  if (invite.role === "steward") {
    if (session.user.role !== "admin") {
      return {
        error: `Only Admins can cancel a ${teamRoleLabels.steward} invite.`,
      };
    }
  } else if (!(await canManageProject(session, project))) {
    return {
      error: "You do not have permission to manage this project's team.",
    };
  }

  await db
    .update(projectInvites)
    .set({ canceledAt: new Date() })
    .where(eq(projectInvites.id, inviteId));

  revalidatePath(`/dashboard/projects/${invite.projectId}/team`);
  return { success: true };
}

export async function acceptInvite(token: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const invite = await db.query.projectInvites.findFirst({
    where: eq(projectInvites.token, token),
    with: { project: { columns: { id: true, name: true, stage: true } } },
  });
  if (!invite) return { error: "This invite link isn't valid." };
  if (invite.canceledAt) return { error: "This invite has been canceled." };
  if (invite.acceptedAt) {
    return { error: "This invite has already been used." };
  }
  if (!hasTeamWorkspace(invite.project.stage)) {
    return { error: "This project's team workspace is no longer available." };
  }

  const teamRole = invite.role as TeamRole;
  const existingRole = await db.query.projectParticipants.findFirst({
    where: and(
      eq(projectParticipants.projectId, invite.projectId),
      eq(projectParticipants.userId, session.user.id),
      eq(projectParticipants.role, teamRole),
    ),
  });

  if (existingRole) {
    if (existingRole.state !== "active") {
      await db
        .update(projectParticipants)
        .set({
          state: "active",
          displayName: session.user.name ?? invite.invitedName,
          addedBy: invite.createdBy,
          updatedAt: new Date(),
        })
        .where(eq(projectParticipants.id, existingRole.id));
    }
  } else {
    await db.insert(projectParticipants).values({
      projectId: invite.projectId,
      userId: session.user.id,
      displayName: session.user.name ?? invite.invitedName,
      role: teamRole,
      state: "active",
      addedBy: invite.createdBy,
    });
  }

  await db
    .update(projectInvites)
    .set({ acceptedAt: new Date(), acceptedBy: session.user.id })
    .where(eq(projectInvites.id, invite.id));

  revalidatePath(`/dashboard/projects/${invite.projectId}/team`);
  revalidatePath("/dashboard");
  return {
    success: true,
    projectId: invite.projectId,
    projectName: invite.project.name,
  };
}
