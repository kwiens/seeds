import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import {
  assertSafeDatabaseUrl,
  getDatabaseSafetySummary,
} from "../lib/db/safety";

config({ path: ".env.local", quiet: true });
config({ path: ".env.development.local", override: true, quiet: true });

const databaseUrl = assertSafeDatabaseUrl(process.env.DATABASE_URL);
const summary = getDatabaseSafetySummary(databaseUrl);
if (summary.production) {
  throw new Error("Sanitization is forbidden on the Production database");
}

const sql = neon(databaseUrl);

await sql.transaction([
  sql`delete from project_activity_reads`,
  sql`delete from project_update_file_deletions`,
  sql`delete from project_updates where visibility = 'team'`,
  sql`delete from project_events`,
  sql`delete from project_budgets where is_public = false`,
  sql`delete from admin_emails`,
  sql`update users
      set email = 'dev+' || replace(id::text, '-', '') || '@example.invalid',
          name = 'Test User ' || left(id::text, 8),
          image = null,
          role = 'user'`,
  sql`update project_participants
      set display_name = 'Test participant ' || left(id::text, 8)
      where user_id is null`,
  sql`update project_participants p
      set display_name = u.name
      from users u
      where p.user_id = u.id`,
]);

const [{ userCount }] = await sql`
  select count(*)::int as "userCount" from users
`;

console.log(
  `Sanitized ${userCount} users and removed private workspace data from ${summary.database}.`,
);
