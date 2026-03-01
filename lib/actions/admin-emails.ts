"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { adminEmails, users } from "@/lib/db/schema";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function addAdminEmail(email: string) {
  const session = await requireAdmin();

  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return { error: "Invalid email address" };
  }

  const existing = await db.query.adminEmails.findFirst({
    where: eq(adminEmails.email, normalized),
    columns: { id: true },
  });
  if (existing) {
    return { error: "Email is already in the admin list" };
  }

  await db.insert(adminEmails).values({
    email: normalized,
    addedBy: session.user.id,
  });

  // If this user already exists, promote them immediately
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, normalized),
    columns: { id: true, role: true },
  });
  if (existingUser && existingUser.role !== "admin") {
    await db
      .update(users)
      .set({ role: "admin" })
      .where(eq(users.id, existingUser.id));
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function removeAdminEmail(id: string) {
  await requireAdmin();

  const record = await db.query.adminEmails.findFirst({
    where: eq(adminEmails.id, id),
    columns: { email: true },
  });
  if (!record) {
    return { error: "Admin email not found" };
  }

  await db.delete(adminEmails).where(eq(adminEmails.id, id));

  // If user exists and their email isn't in the env var, demote them
  const envAdminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!envAdminEmails.includes(record.email)) {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, record.email),
      columns: { id: true },
    });
    if (existingUser) {
      await db
        .update(users)
        .set({ role: "user" })
        .where(eq(users.id, existingUser.id));
    }
  }

  revalidatePath("/admin");
  return { success: true };
}
