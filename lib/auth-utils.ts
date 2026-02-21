export function canEditSeed(
  session: { user: { id: string; role: string } } | null | undefined,
  seed: { createdBy: string },
): boolean {
  if (!session?.user?.id) return false;
  return seed.createdBy === session.user.id || session.user.role === "admin";
}
