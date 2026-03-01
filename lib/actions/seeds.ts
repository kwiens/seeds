"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canEditSeed } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { seeds } from "@/lib/db/schema";
import { seedFormSchema, type SeedFormValues } from "@/lib/validations/seed";

function seedFormToDbFields(values: SeedFormValues) {
  return {
    name: values.name,
    summary: values.summary,
    gardeners: values.gardeners,
    locationAddress: values.locationAddress ?? null,
    locationLat: values.locationLat ?? null,
    locationLng: values.locationLng ?? null,
    category: values.category,
    roots: values.roots,
    supportPeople: values.supportPeople,
    waterHave: values.waterHave,
    waterNeed: values.waterNeed,
    obstacles: values.obstacles ?? null,
  };
}

export async function createSeed(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in to plant a seed." };
  }

  const parsed = seedFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }

  const values = parsed.data;

  const [created] = await db
    .insert(seeds)
    .values({
      ...seedFormToDbFields(values),
      status: "pending",
      createdBy: session.user.id,
    })
    .returning({ id: seeds.id });

  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect(`/seeds/${created.id}`);
}

export async function updateSeed(id: string, data: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const seed = await db.query.seeds.findFirst({
    where: eq(seeds.id, id),
  });

  if (!seed) {
    return { error: "Seed not found." };
  }

  if (!canEditSeed(session, seed)) {
    return { error: "You don't have permission to edit this seed." };
  }

  const parsed = seedFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }

  const values = parsed.data;

  await db
    .update(seeds)
    .set({
      ...seedFormToDbFields(values),
      updatedAt: new Date(),
    })
    .where(eq(seeds.id, id));

  revalidatePath(`/seeds/${id}`);
  revalidatePath("/");
  revalidatePath("/dashboard");
  redirect(`/seeds/${id}`);
}
