"use server";

import { and, eq, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { canManageProject } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { projectParticipants, projects } from "@/lib/db/schema";
import { findUserByEmail } from "@/lib/db/queries/users";
import {
  teamRoleKeys,
  teamRoleLabels,
  type TeamRole,
} from "@/lib/participant-roles";
import { hasTeamWorkspace } from "@/lib/project-stages";

export async function addTeamMember(
  projectId: string,
  email: string,
  role: string,
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };
  if (!teamRoleKeys.includes(role as TeamRole))
    return { error: "Invalid role." };
  const teamRole = role as TeamRole;

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { id: true, stage: true },
  });
  if (!project) return { error: "Project not found." };
  if (!hasTeamWorkspace(project.stage)) {
    return {
      error: "Team members can be managed after a project becomes a Sprout.",
    };
  }

  if (teamRole === "steward") {
    if (session.user.role !== "admin") {
      return { error: `Only Admins can assign a ${teamRoleLabels.steward}.` };
    }
  } else if (!(await canManageProject(session, project))) {
    return {
      error: "You do not have permission to manage this project's team.",
    };
  }

  const target = await findUserByEmail(email);
  if (!target) {
    return {
      error:
        "No account found with that email — they need to sign in once first.",
    };
  }

  const existingRole = await db.query.projectParticipants.findFirst({
    where: and(
      eq(projectParticipants.projectId, projectId),
      eq(projectParticipants.userId, target.id),
      eq(projectParticipants.role, teamRole),
    ),
  });
  if (existingRole?.state === "active") {
    return { error: `This person is already a ${teamRoleLabels[teamRole]}.` };
  }

  try {
    if (existingRole) {
      await db
        .update(projectParticipants)
        .set({
          state: "active",
          displayName: target.name,
          addedBy: session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(projectParticipants.id, existingRole.id));
    } else {
      await db.insert(projectParticipants).values({
        projectId,
        userId: target.id,
        displayName: target.name,
        role: teamRole,
        state: "active",
        addedBy: session.user.id,
      });
    }
  } catch (error) {
    if (isUniqueViolation(error))
      return { error: "This role is already assigned." };
    throw error;
  }

  revalidatePath(`/dashboard/projects/${projectId}/team`);
  revalidatePath("/dashboard");
  return { success: true };
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function removeTeamMember(projectId: string, userId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { id: true, stage: true },
  });
  if (!project) return { error: "Project not found." };
  if (!hasTeamWorkspace(project.stage)) {
    return { error: "This project does not have a team workspace yet." };
  }
  if (!(await canManageProject(session, project))) {
    return {
      error: "You do not have permission to manage this project's team.",
    };
  }

  const activeRoles = await db.query.projectParticipants.findMany({
    where: and(
      eq(projectParticipants.projectId, projectId),
      eq(projectParticipants.userId, userId),
      eq(projectParticipants.state, "active"),
      ne(projectParticipants.role, "supporter"),
    ),
    columns: { id: true, role: true },
  });
  if (activeRoles.length === 0)
    return { error: "This person isn't on the team." };
  if (
    activeRoles.some((item) => item.role === "gardener") &&
    session.user.role !== "admin"
  ) {
    return { error: "Only Admins can remove a Gardener." };
  }
  if (
    activeRoles.some((item) => item.role === "steward") &&
    session.user.role !== "admin"
  ) {
    return { error: `Only Admins can remove a ${teamRoleLabels.steward}.` };
  }

  await db
    .update(projectParticipants)
    .set({ state: "inactive", updatedAt: new Date() })
    .where(
      and(
        eq(projectParticipants.projectId, projectId),
        eq(projectParticipants.userId, userId),
        eq(projectParticipants.state, "active"),
        inArray(projectParticipants.role, ["gardener", ...teamRoleKeys]),
      ),
    );

  revalidatePath(`/dashboard/projects/${projectId}/team`);
  revalidatePath("/dashboard");
  return { success: true };
}
