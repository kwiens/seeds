import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const user = await db.query.users.findFirst({
    where: eq(users.email, normalized),
  });
  return user ?? null;
}
