/**
 * Pure helpers for reading a NextAuth session. No database access, so these
 * are safe to import from anywhere, including client components and tests
 * that mock the database.
 */

export type SessionLike =
  | { user: { id: string; role: string; name?: string | null } }
  | null
  | undefined;

export function isSignedIn(
  session: SessionLike,
): session is NonNullable<SessionLike> {
  return Boolean(session?.user?.id);
}

export function isAdmin(session: SessionLike): boolean {
  return session?.user?.role === "admin";
}

export function isCouncil(session: SessionLike): boolean {
  return session?.user?.role === "council";
}
