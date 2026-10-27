import { auth } from "@/auth";
import { isAdmin, isSignedIn } from "@/lib/session";

/**
 * Admin-only server actions call this first. It throws rather than returning
 * an error because an unauthorized call to an admin action is a bug or an
 * attack, not a user mistake to surface in a form.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!isSignedIn(session) || !isAdmin(session)) {
    throw new Error("Unauthorized");
  }
  return session;
}
