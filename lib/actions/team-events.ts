"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projectEvents } from "@/lib/db/schema";
import { checkProjectAccess, requireProjectAccess } from "@/lib/project-access";
import { revalidateProject } from "@/lib/revalidate";
import { teamEventFormSchema } from "@/lib/validations/team-event";
import { type ActionResult, firstIssue } from "./result";

const UNAVAILABLE = "Events become available at the Sprout stage.";

export async function createEvent(
  projectId: string,
  data: unknown,
): Promise<ActionResult> {
  const access = await requireProjectAccess(projectId, {
    level: "manage",
    requireWorkspace: true,
    forbidden: "You do not have permission to add events for this project.",
    unavailable: UNAVAILABLE,
  });
  if ("error" in access) return access;

  const parsed = teamEventFormSchema.safeParse(data);
  if (!parsed.success) return { error: firstIssue(parsed) };

  await db.insert(projectEvents).values({
    projectId,
    createdBy: access.session.user.id,
    title: parsed.data.title,
    startsAt: parsed.data.startsAt,
    location: parsed.data.location || null,
  });
  revalidateProject(projectId);
  return { success: true };
}

export async function updateEvent(
  eventId: string,
  data: unknown,
): Promise<ActionResult> {
  const found = await findEventForManager(
    eventId,
    "You do not have permission to edit this event.",
  );
  if (found.error !== undefined) return { error: found.error };

  const parsed = teamEventFormSchema.safeParse(data);
  if (!parsed.success) return { error: firstIssue(parsed) };

  await db
    .update(projectEvents)
    .set({
      title: parsed.data.title,
      startsAt: parsed.data.startsAt,
      location: parsed.data.location || null,
      updatedAt: new Date(),
    })
    .where(eq(projectEvents.id, eventId));
  revalidateProject(found.projectId);
  return { success: true };
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  const found = await findEventForManager(
    eventId,
    "You do not have permission to delete this event.",
  );
  if (found.error !== undefined) return { error: found.error };

  await db.delete(projectEvents).where(eq(projectEvents.id, eventId));
  revalidateProject(found.projectId);
  return { success: true };
}

async function findEventForManager(
  eventId: string,
  forbidden: string,
): Promise<
  | { error: string; projectId?: undefined }
  | { projectId: string; error?: undefined }
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const event = await db.query.projectEvents.findFirst({
    where: eq(projectEvents.id, eventId),
    with: { project: { columns: { id: true, stage: true, archivedAt: true } } },
  });
  if (!event) return { error: "Event not found." };

  const error = await checkProjectAccess(session, event.project, {
    level: "manage",
    requireWorkspace: true,
    forbidden,
    unavailable: UNAVAILABLE,
  });
  if (error) return { error };
  return { projectId: event.projectId };
}
