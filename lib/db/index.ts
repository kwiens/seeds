import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { assertSafeDatabaseUrl } from "./safety";
import * as schema from "./schema";

function createDatabase(): NeonHttpDatabase<typeof schema> {
  const databaseUrl = assertSafeDatabaseUrl(process.env.DATABASE_URL);
  return drizzle(neon(databaseUrl), { schema });
}

export const db = createDatabase();
