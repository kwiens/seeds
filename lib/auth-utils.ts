import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { seedTeamMembers } from "@/lib/db/schema";

export function canEditSeed(
  session: { user: { id: string; role: string } } | null | undefined,
  seed: { createdBy: string },
): boolean {
  if (!session?.user?.id) return false;
  return seed.createdBy === session.user.id || session.user.role === "admin";
}

// Who can view/post in a Sprout's private Team Updates thread: the owner,
// an Admin, or anyone with a seed_team_members row for this Sprout (Steward,
// co-Gardener, Guide, Roots, Cultivator).
export async function canAccessTeamUpdates(
  session: { user: { id: string; role: string } } | null | undefined,
  seed: { id: string; createdBy: string },
): Promise<boolean> {
  if (canEditSeed(session, seed)) return true;
  if (!session?.user?.id) return false;

  const membership = await db.query.seedTeamMembers.findFirst({
    where: and(
      eq(seedTeamMembers.seedId, seed.id),
      eq(seedTeamMembers.userId, session.user.id),
    ),
    columns: { id: true },
  });
  return !!membership;
}
