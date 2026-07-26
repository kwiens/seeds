import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { seedTeamMembers, seeds } from "@/lib/db/schema";
import type { TeamRole } from "@/lib/team-roles";
import { teamRoleLabels } from "@/lib/team-roles";

export interface RosterMember {
  userId: string;
  name: string;
  image: string | null;
  roleLabel: string;
  addedByName: string | null;
  joinedAt: Date | null;
}

export async function getTeamMembers(seedId: string): Promise<RosterMember[]> {
  const seed = await db.query.seeds.findFirst({
    where: eq(seeds.id, seedId),
    columns: { id: true },
    with: { creator: { columns: { id: true, name: true, image: true } } },
  });
  if (!seed) return [];

  const memberRows = await db.query.seedTeamMembers.findMany({
    where: eq(seedTeamMembers.seedId, seedId),
    with: {
      user: { columns: { id: true, name: true, image: true } },
      addedByUser: { columns: { name: true } },
    },
    orderBy: (t, { asc }) => asc(t.createdAt),
  });

  const gardener: RosterMember = {
    userId: seed.creator.id,
    name: seed.creator.name,
    image: seed.creator.image,
    roleLabel: "Gardener",
    addedByName: null,
    joinedAt: null,
  };

  const members: RosterMember[] = memberRows.map((row) => ({
    userId: row.user.id,
    name: row.user.name,
    image: row.user.image,
    roleLabel: teamRoleLabels[row.role as TeamRole],
    addedByName: row.addedByUser.name,
    joinedAt: row.createdAt,
  }));

  return [gardener, ...members];
}
