import { and, asc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { seedTeamEvents } from "@/lib/db/schema";

export async function getUpcomingEvents(seedId: string) {
  return db.query.seedTeamEvents.findMany({
    where: and(
      eq(seedTeamEvents.seedId, seedId),
      gte(seedTeamEvents.startsAt, new Date()),
    ),
    orderBy: asc(seedTeamEvents.startsAt),
  });
}
