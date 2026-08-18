// Invite links aren't email-locked (the inviter often doesn't have the
// invitee's email yet), so this is a soft sanity check, not a security
// boundary: does the signed-in account's name look like the name the
// invite was made out to?
export function namesLikelyMatch(invitedName: string, accountName: string) {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 1);

  const invitedWords = new Set(normalize(invitedName));
  const accountWords = normalize(accountName);
  return accountWords.some((word) => invitedWords.has(word));
}
