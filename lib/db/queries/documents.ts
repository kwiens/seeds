import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { seedTeamUpdates, users } from "@/lib/db/schema";

export interface SeedDocument {
  name: string;
  url: string;
  size: number;
  updateId: string;
  posterName: string;
  createdAt: Date;
}

export async function getSeedDocuments(
  seedId: string,
): Promise<SeedDocument[]> {
  const rows = await db
    .select({
      id: seedTeamUpdates.id,
      attachments: seedTeamUpdates.attachments,
      createdAt: seedTeamUpdates.createdAt,
      posterName: users.name,
    })
    .from(seedTeamUpdates)
    .innerJoin(users, eq(seedTeamUpdates.userId, users.id))
    .where(eq(seedTeamUpdates.seedId, seedId));

  const documents: SeedDocument[] = [];
  for (const row of rows) {
    for (const file of row.attachments) {
      documents.push({
        name: file.name,
        url: file.url,
        size: file.size,
        updateId: row.id,
        posterName: row.posterName,
        createdAt: row.createdAt,
      });
    }
  }

  return documents.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}
