import { randomBytes } from "node:crypto";
import {
  chmodSync,
  existsSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { parse } from "dotenv";
import { assertSafeBlobStores, assertSafeDatabaseUrl } from "../lib/db/safety";

const CANONICAL_PROJECT_ID = "prj_5aveWXn8kWvlnplpXBaZdg7k3kjC";
const localOverridesPath = ".env.development.local";
const pulledEnvironmentPath = ".env.vercel-development.tmp";

assertCanonicalProject();

try {
  execFileSync(
    "vercel",
    [
      "env",
      "pull",
      pulledEnvironmentPath,
      "--environment=development",
      "--yes",
    ],
    { stdio: "inherit" },
  );

  const pulledEnvironment = parse(readFileSync(pulledEnvironmentPath));
  validatePulledEnvironment(pulledEnvironment);
  renameSync(pulledEnvironmentPath, ".env.local");
  chmodSync(".env.local", 0o600);
} finally {
  if (existsSync(pulledEnvironmentPath)) unlinkSync(pulledEnvironmentPath);
}

ensureLocalAuthSecret();

console.log(
  "Development variables are synced and a machine-only Auth secret is configured.",
);

function assertCanonicalProject() {
  const repoConfigPath = ".vercel/repo.json";
  const projectConfigPath = ".vercel/project.json";
  const configPath = existsSync(repoConfigPath)
    ? repoConfigPath
    : projectConfigPath;

  if (!existsSync(configPath)) {
    throw new Error(
      "This worktree is not linked. Run `vercel link --yes --scope chattanooga-seeds --project seeds` first.",
    );
  }

  const config = JSON.parse(readFileSync(configPath, "utf8")) as {
    projectId?: string;
    projects?: { id?: string }[];
  };
  const projectIds = [
    config.projectId,
    ...(config.projects?.map((project) => project.id) ?? []),
  ];

  if (!projectIds.includes(CANONICAL_PROJECT_ID)) {
    throw new Error(
      "This worktree is linked to the wrong Vercel project. Link chattanooga-seeds/seeds before pulling variables.",
    );
  }
}

function validatePulledEnvironment(environment: Record<string, string>) {
  if (environment.AUTH_SECRET) {
    throw new Error(
      "Development AUTH_SECRET must not be shared through Vercel. Scope it away from Development before continuing.",
    );
  }

  assertSafeDatabaseUrl(environment.DATABASE_URL, {
    environment: "development",
  });
  assertSafeBlobStores(
    {
      publicToken: environment.BLOB_READ_WRITE_TOKEN,
      teamToken: environment.TEAM_FILES_BLOB_READ_WRITE_TOKEN,
    },
    { environment: "development" },
  );
}

function ensureLocalAuthSecret() {
  const existing = existsSync(localOverridesPath)
    ? readFileSync(localOverridesPath, "utf8")
    : "";
  if (parse(existing).AUTH_SECRET) return;

  const separator = existing.length > 0 && !existing.endsWith("\n") ? "\n" : "";
  const authSecret = randomBytes(48).toString("base64");
  writeFileSync(
    localOverridesPath,
    `${existing}${separator}AUTH_SECRET=${authSecret}\n`,
    { mode: 0o600 },
  );
  chmodSync(localOverridesPath, 0o600);
}
