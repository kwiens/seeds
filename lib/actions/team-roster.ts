"use server";

import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db/errors";
import { findUserByEmail } from "@/lib/db/queries/users";
import { projectParticipants } from "@/lib/db/schema";
import {
  teamRoleKeys,
  teamRoleLabels,
  type TeamRole,
} from "@/lib/participant-roles";
import { requireProjectAccess } from "@/lib/project-access";
import { revalidateProject } from "@/lib/revalidate";
import { isAdmin } from "@/lib/session";
import type { ActionResult } from "./result";

export async function addTeamMember(
  projectId: string,
  email: string,
  role: string,
): Promise<ActionResult<{ link?: undefined }>> {
  if (!teamRoleKeys.includes(role as TeamRole))
    return { error: "Invalid role." };
  const teamRole = role as TeamRole;

  // Stewards represent the city, so only admins may seat one.
  const access = await requireProjectAccess(projectId, {
    level: teamRole === "steward" ? "admin" : "manage",
    requireWorkspace: true,
    forbidden:
      teamRole === "steward"
        ? `Only Admins can assign a ${teamRoleLabels.steward}.`
        : "You do not have permission to manage this project's team.",
    unavailable:
      "Team members can be managed after a project becomes a Sprout.",
  });
  if ("error" in access) return access;
  const { session } = access;

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

  revalidateProject(projectId);
  return { success: true };
}

export async function removeTeamMember(
  projectId: string,
  userId: string,
): Promise<ActionResult> {
  const access = await requireProjectAccess(projectId, {
    level: "manage",
    requireWorkspace: true,
    forbidden: "You do not have permission to manage this project's team.",
    unavailable: "This project does not have a team workspace yet.",
  });
  if ("error" in access) return access;
  const { session } = access;

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
    !isAdmin(session)
  ) {
    return { error: "Only Admins can remove a Gardener." };
  }
  if (
    activeRoles.some((item) => item.role === "steward") &&
    !isAdmin(session)
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

  revalidateProject(projectId);
  return { success: true };
}
