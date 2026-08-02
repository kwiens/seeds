"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { canEditSeed } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { seedTeamEvents } from "@/lib/db/schema";
import { teamEventFormSchema } from "@/lib/validations/team-event";

export async function createEvent(seedId: string, data: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const seed = await db.query.seeds.findFirst({
    where: (seeds, { eq }) => eq(seeds.id, seedId),
    columns: { id: true, createdBy: true, status: true },
  });
  if (!seed) return { error: "Seed not found." };

  if (!canEditSeed(session, seed)) {
    return {
      error: "You do not have permission to add events for this Sprout.",
    };
  }

  if (seed.status !== "in_progress") {
    return { error: "Events are only available for Sprouts." };
  }

  const parsed = teamEventFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }

  await db.insert(seedTeamEvents).values({
    seedId,
    createdBy: session.user.id,
    title: parsed.data.title,
    startsAt: parsed.data.startsAt,
    location: parsed.data.location || null,
  });

  revalidatePath(`/seeds/${seedId}/team`);
  return { success: true };
}

export async function updateEvent(eventId: string, data: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const event = await db.query.seedTeamEvents.findFirst({
    where: eq(seedTeamEvents.id, eventId),
    with: { seed: { columns: { id: true, createdBy: true, status: true } } },
  });
  if (!event) return { error: "Event not found." };

  if (!canEditSeed(session, event.seed)) {
    return {
      error: "You do not have permission to edit events for this Sprout.",
    };
  }

  if (event.seed.status !== "in_progress") {
    return { error: "Events are only available for Sprouts." };
  }

  const parsed = teamEventFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }

  await db
    .update(seedTeamEvents)
    .set({
      title: parsed.data.title,
      startsAt: parsed.data.startsAt,
      location: parsed.data.location || null,
      updatedAt: new Date(),
    })
    .where(eq(seedTeamEvents.id, eventId));

  revalidatePath(`/seeds/${event.seedId}/team`);
  return { success: true };
}

export async function deleteEvent(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const event = await db.query.seedTeamEvents.findFirst({
    where: eq(seedTeamEvents.id, eventId),
    with: { seed: { columns: { id: true, createdBy: true, status: true } } },
  });
  if (!event) return { error: "Event not found." };

  if (!canEditSeed(session, event.seed)) {
    return {
      error: "You do not have permission to delete events for this Sprout.",
    };
  }

  if (event.seed.status !== "in_progress") {
    return { error: "Events are only available for Sprouts." };
  }

  await db.delete(seedTeamEvents).where(eq(seedTeamEvents.id, eventId));

  revalidatePath(`/seeds/${event.seedId}/team`);
  return { success: true };
}
