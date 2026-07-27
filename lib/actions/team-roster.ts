"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { canEditSeed } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { seeds, seedTeamMembers } from "@/lib/db/schema";
import { findUserByEmail } from "@/lib/db/queries/users";
import { teamRoleKeys, type TeamRole } from "@/lib/team-roles";

export async function addTeamMember(
  seedId: string,
  email: string,
  role: string,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  if (!teamRoleKeys.includes(role as TeamRole)) {
    return { error: "Invalid role." };
  }
  const teamRole = role as TeamRole;

  const seed = await db.query.seeds.findFirst({
    where: eq(seeds.id, seedId),
    columns: { id: true, createdBy: true },
  });
  if (!seed) return { error: "Seed not found." };

  const target = await findUserByEmail(email);
  if (!target) {
    return {
      error:
        "No account found with that email — they need to sign in once first.",
    };
  }

  if (teamRole === "steward") {
    if (session.user.role !== "admin") {
      return { error: "Only Admins can assign a Steward." };
    }
  } else {
    if (!canEditSeed(session, seed)) {
      return {
        error: "You do not have permission to manage this Sprout's team.",
      };
    }
  }

  const existing = await db.query.seedTeamMembers.findFirst({
    where: (t, { and, eq }) =>
      and(eq(t.seedId, seedId), eq(t.userId, target.id)),
    columns: { id: true },
  });
  if (existing) {
    return { error: "This person is already on the team." };
  }

  await db.insert(seedTeamMembers).values({
    seedId,
    userId: target.id,
    role: teamRole,
    addedBy: session.user.id,
  });

  revalidatePath(`/seeds/${seedId}/team`);
  revalidatePath("/dashboard/sprouts");
  return { success: true };
}

export async function removeTeamMember(seedId: string, userId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const seed = await db.query.seeds.findFirst({
    where: eq(seeds.id, seedId),
    columns: { id: true, createdBy: true },
  });
  if (!seed) return { error: "Seed not found." };

  const membership = await db.query.seedTeamMembers.findFirst({
    where: (t, { and, eq }) => and(eq(t.seedId, seedId), eq(t.userId, userId)),
    columns: { id: true, role: true },
  });
  if (!membership) return { error: "This person isn't on the team." };

  if (membership.role === "steward") {
    if (session.user.role !== "admin") {
      return { error: "Only Admins can remove a Steward." };
    }
  } else if (!canEditSeed(session, seed)) {
    return {
      error: "You do not have permission to manage this Sprout's team.",
    };
  }

  await db.delete(seedTeamMembers).where(eq(seedTeamMembers.id, membership.id));

  revalidatePath(`/seeds/${seedId}/team`);
  revalidatePath("/dashboard/sprouts");
  return { success: true };
}
