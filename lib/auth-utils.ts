export function canEditSeed(
  session: { user: { id: string; role: string } } | null | undefined,
  seed: { createdBy: string },
): boolean {
  if (!session?.user?.id) return false;
  return seed.createdBy === session.user.id || session.user.role === "admin";
}

// Who can view/post in a Sprout's private Team Updates thread. For now this
// is identical to canEditSeed (owner or admin) — once Council/Steward and
// the Sprout team roster exist, this grows to also check for a roster row,
// without any call site needing to change.
export function canAccessTeamUpdates(
  session: { user: { id: string; role: string } } | null | undefined,
  seed: { createdBy: string },
): boolean {
  return canEditSeed(session, seed);
}
