"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { canEditSeed } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { seedUpdates } from "@/lib/db/schema";
import { seedUpdateFormSchema } from "@/lib/validations/seed-update";

export async function createUpdate(seedId: string, data: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to post an update." };
  }

  const seed = await db.query.seeds.findFirst({
    where: (seeds, { eq }) => eq(seeds.id, seedId),
    columns: { id: true, createdBy: true },
  });

  if (!seed) return { error: "Seed not found." };

  if (!canEditSeed(session, seed)) {
    return {
      error: "You do not have permission to post updates for this seed.",
    };
  }

  const parsed = seedUpdateFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }

  const [created] = await db
    .insert(seedUpdates)
    .values({
      seedId,
      title: parsed.data.title,
      body: parsed.data.body,
      createdBy: session.user.id,
    })
    .returning({ id: seedUpdates.id });

  revalidatePath(`/seeds/${seedId}`);
  revalidatePath(`/seeds/${seedId}/updates`);
  return { success: true, updateId: created.id };
}

export async function editUpdate(updateId: string, data: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const update = await db.query.seedUpdates.findFirst({
    where: eq(seedUpdates.id, updateId),
    with: { seed: { columns: { id: true, createdBy: true } } },
  });

  if (!update) return { error: "Update not found." };

  if (!canEditSeed(session, { createdBy: update.seed.createdBy })) {
    return { error: "You do not have permission to edit this update." };
  }

  const parsed = seedUpdateFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }

  await db
    .update(seedUpdates)
    .set({
      title: parsed.data.title,
      body: parsed.data.body,
      updatedAt: new Date(),
    })
    .where(eq(seedUpdates.id, updateId));

  revalidatePath(`/seeds/${update.seed.id}`);
  revalidatePath(`/seeds/${update.seed.id}/updates`);
  revalidatePath(`/seeds/${update.seed.id}/updates/${updateId}`);
  return { success: true };
}

export async function deleteUpdate(updateId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const update = await db.query.seedUpdates.findFirst({
    where: eq(seedUpdates.id, updateId),
    with: { seed: { columns: { id: true, createdBy: true } } },
  });

  if (!update) return { error: "Update not found." };

  if (!canEditSeed(session, { createdBy: update.seed.createdBy })) {
    return { error: "You do not have permission to delete this update." };
  }

  await db.delete(seedUpdates).where(eq(seedUpdates.id, updateId));

  revalidatePath(`/seeds/${update.seed.id}`);
  revalidatePath(`/seeds/${update.seed.id}/updates`);
  return { success: true };
}
