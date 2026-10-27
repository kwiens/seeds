/**
 * Admin access is granted by email: the ADMIN_EMAILS environment variable
 * (bootstrap, deploy-time) plus the admin_emails table (runtime, managed from
 * the Admin page). Both lists promote matching users on their next sign-in.
 */
export function getEnvAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
