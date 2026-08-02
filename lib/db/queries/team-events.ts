import { and, asc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectEvents } from "@/lib/db/schema";

export async function getUpcomingEvents(projectId: string) {
  return db.query.projectEvents.findMany({
    where: and(
      eq(projectEvents.projectId, projectId),
      gte(projectEvents.startsAt, new Date()),
    ),
    orderBy: asc(projectEvents.startsAt),
  });
}
