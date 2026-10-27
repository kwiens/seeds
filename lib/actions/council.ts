"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { findUserByEmail } from "@/lib/db/queries/users";
import { users } from "@/lib/db/schema";
import { routes } from "@/lib/routes";

export async function promoteToCouncil(email: string) {
  await requireAdmin();

  const user = await findUserByEmail(email);
  if (!user) {
    return {
      error:
        "No account found with that email — they need to sign in once first.",
    };
  }
  if (user.role === "admin") {
    return { error: "This person is already an Admin." };
  }
  if (user.role === "council") {
    return { error: "This person is already on the Council." };
  }

  await db.update(users).set({ role: "council" }).where(eq(users.id, user.id));

  revalidatePath(routes.admin);
  return { success: true };
}

export async function demoteFromCouncil(userId: string) {
  await requireAdmin();

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { role: true },
  });
  if (!user) {
    return { error: "User not found." };
  }
  if (user.role !== "council") {
    return { error: "This person is not on the Council." };
  }

  await db.update(users).set({ role: "user" }).where(eq(users.id, userId));

  revalidatePath(routes.admin);
  return { success: true };
}
