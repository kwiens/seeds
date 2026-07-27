"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { canEditSeed } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { seedBudgets } from "@/lib/db/schema";
import { budgetFormSchema } from "@/lib/validations/budget";

export async function saveBudget(
  seedId: string,
  status: string,
  data: unknown,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  if (status !== "proposed" && status !== "final") {
    return { error: "Invalid budget stage." };
  }

  const seed = await db.query.seeds.findFirst({
    where: (seeds, { eq }) => eq(seeds.id, seedId),
    columns: { id: true, createdBy: true },
  });
  if (!seed) return { error: "Seed not found." };

  if (!canEditSeed(session, seed)) {
    return {
      error: "You do not have permission to edit this Sprout's budget.",
    };
  }

  const parsed = budgetFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }

  await db
    .insert(seedBudgets)
    .values({
      seedId,
      status,
      lineItems: parsed.data.lineItems,
      notes: parsed.data.notes || null,
      updatedBy: session.user.id,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [seedBudgets.seedId, seedBudgets.status],
      set: {
        lineItems: parsed.data.lineItems,
        notes: parsed.data.notes || null,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      },
    });

  revalidatePath(`/seeds/${seedId}/team`);
  return { success: true };
}
