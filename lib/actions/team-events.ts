"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { canManageProject } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { projectEvents } from "@/lib/db/schema";
import { hasTeamWorkspace } from "@/lib/project-stages";
import { teamEventFormSchema } from "@/lib/validations/team-event";

export async function createEvent(projectId: string, data: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const project = await db.query.projects.findFirst({
    where: (projects, { eq }) => eq(projects.id, projectId),
    columns: { id: true, stage: true },
  });
  if (!project) return { error: "Project not found." };
  if (!(await canManageProject(session, project))) {
    return {
      error: "You do not have permission to add events for this project.",
    };
  }
  if (!hasTeamWorkspace(project.stage)) {
    return { error: "Events become available at the Sprout stage." };
  }

  const parsed = teamEventFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }

  await db.insert(projectEvents).values({
    projectId,
    createdBy: session.user.id,
    title: parsed.data.title,
    startsAt: parsed.data.startsAt,
    location: parsed.data.location || null,
  });
  revalidatePath(`/seeds/${projectId}/team`);
  return { success: true };
}

export async function updateEvent(eventId: string, data: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const event = await db.query.projectEvents.findFirst({
    where: eq(projectEvents.id, eventId),
    with: { project: { columns: { id: true, stage: true } } },
  });
  if (!event) return { error: "Event not found." };
  if (!(await canManageProject(session, event.project))) {
    return { error: "You do not have permission to edit this event." };
  }
  if (!hasTeamWorkspace(event.project.stage)) {
    return { error: "Events become available at the Sprout stage." };
  }

  const parsed = teamEventFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }

  await db
    .update(projectEvents)
    .set({
      title: parsed.data.title,
      startsAt: parsed.data.startsAt,
      location: parsed.data.location || null,
      updatedAt: new Date(),
    })
    .where(eq(projectEvents.id, eventId));
  revalidatePath(`/seeds/${event.projectId}/team`);
  return { success: true };
}

export async function deleteEvent(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const event = await db.query.projectEvents.findFirst({
    where: eq(projectEvents.id, eventId),
    with: { project: { columns: { id: true, stage: true } } },
  });
  if (!event) return { error: "Event not found." };
  if (!(await canManageProject(session, event.project))) {
    return { error: "You do not have permission to delete this event." };
  }
  if (!hasTeamWorkspace(event.project.stage)) {
    return { error: "Events become available at the Sprout stage." };
  }

  await db.delete(projectEvents).where(eq(projectEvents.id, eventId));
  revalidatePath(`/seeds/${event.projectId}/team`);
  return { success: true };
}
