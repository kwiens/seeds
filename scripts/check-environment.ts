import { config } from "dotenv";
import {
  assertSafeBlobStores,
  assertSafeDatabaseUrl,
  getDatabaseSafetySummary,
} from "../lib/db/safety";

config({ path: ".env.local", quiet: true });
config({ path: ".env.development.local", override: true, quiet: true });

const databaseUrl = assertSafeDatabaseUrl(process.env.DATABASE_URL);
const summary = getDatabaseSafetySummary(databaseUrl);

if (process.argv.includes("--app")) {
  const required = [
    "AUTH_SECRET",
    "AUTH_GOOGLE_ID",
    "AUTH_GOOGLE_SECRET",
    "NEXT_PUBLIC_MAPBOX_TOKEN",
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "BLOB_READ_WRITE_TOKEN",
    "TEAM_FILES_BLOB_READ_WRITE_TOKEN",
  ];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  assertSafeBlobStores({
    publicToken: process.env.BLOB_READ_WRITE_TOKEN,
    teamToken: process.env.TEAM_FILES_BLOB_READ_WRITE_TOKEN,
  });
}

console.log(
  [
    `environment=${summary.environment}`,
    `database=${summary.database}`,
    `endpoint=${summary.endpoint}`,
    `production=${summary.production}`,
  ].join(" "),
);
