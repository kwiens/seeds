import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { assertSafeDatabaseUrl } from "./lib/db/safety";

config({ path: ".env.local", quiet: true });
config({ path: ".env.development.local", override: true, quiet: true });

const databaseUrl = assertSafeDatabaseUrl(process.env.DATABASE_URL);

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
