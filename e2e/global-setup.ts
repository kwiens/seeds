import { config as loadEnvironment } from "dotenv";
import { sql } from "drizzle-orm";
import { assertSafeDatabaseUrl, isProductionDatabase } from "@/lib/db/safety";
import { e2eDirectoryUsers, e2eTestUsers } from "./fixtures/test-users";

export default async function globalSetup() {
  loadEnvironment({ path: ".env.local", quiet: true });
  loadEnvironment({
    path: ".env.development.local",
    override: true,
    quiet: true,
  });

  if (process.env.VERCEL_ENV === "production") {
    throw new Error("Playwright must never run against Production resources.");
  }

  const databaseUrl = assertSafeDatabaseUrl(process.env.DATABASE_URL);
  if (isProductionDatabase(databaseUrl)) {
    throw new Error("Playwright must never seed the Production database.");
  }

  const [{ db }, { users }] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/db/schema"),
  ]);

  await db
    .insert(users)
    .values([...Object.values(e2eTestUsers), ...e2eDirectoryUsers])
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: sql`excluded.name`,
        role: sql`excluded.role`,
        createdAt: sql`excluded.created_at`,
        image: null,
      },
    });
}
