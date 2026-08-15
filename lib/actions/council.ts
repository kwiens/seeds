"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { findUserByEmail } from "@/lib/db/queries/users";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

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

  revalidatePath("/admin");
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

  revalidatePath("/admin");
  return { success: true };
}
