import {
  blobStores,
  productionDatabase,
  type ResourceEnvironment,
} from "../../config/deployment";

type DatabaseSafetyOptions = {
  environment?: string;
  allowProduction?: boolean;
};

type BlobSafetyOptions = {
  environment?: string;
};

export type DatabaseIdentity = {
  endpoint: string;
  database: string;
};

export type BlobStoreTokens = {
  publicToken: string | undefined;
  teamToken: string | undefined;
};

export function getDatabaseIdentity(databaseUrl: string): DatabaseIdentity {
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL is not a valid PostgreSQL connection URL");
  }

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error("DATABASE_URL must use the postgresql:// protocol");
  }

  const endpoint = url.hostname.split(".")[0]?.replace(/-pooler$/, "");
  const database = decodeURIComponent(url.pathname.slice(1));
  if (!endpoint || !database) {
    throw new Error("DATABASE_URL must include a Neon endpoint and database");
  }

  return { endpoint, database };
}

export function isProductionDatabase(databaseUrl: string) {
  const identity = getDatabaseIdentity(databaseUrl);
  return (
    identity.endpoint === productionDatabase.endpoint &&
    identity.database === productionDatabase.database
  );
}

export function assertSafeDatabaseUrl(
  databaseUrl: string | undefined,
  options: DatabaseSafetyOptions = {},
) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured. Run `pnpm env:setup`.");
  }

  const environment = options.environment ?? process.env.VERCEL_ENV ?? "local";
  const allowProduction =
    options.allowProduction ?? process.env.ALLOW_PRODUCTION_DATABASE === "true";
  const targetsProduction = isProductionDatabase(databaseUrl);

  if (targetsProduction && environment !== "production" && !allowProduction) {
    throw new Error(
      `Refusing to use the Production database from ${environment}. Pull the Development environment from Vercel instead.`,
    );
  }

  if (environment === "production" && !targetsProduction && !allowProduction) {
    throw new Error(
      "Refusing to run a Production deployment against a non-production database.",
    );
  }

  return databaseUrl;
}

export function getDatabaseSafetySummary(
  databaseUrl: string,
  environment = process.env.VERCEL_ENV ?? "local",
) {
  const identity = getDatabaseIdentity(databaseUrl);
  return {
    environment,
    ...identity,
    production: isProductionDatabase(databaseUrl),
  };
}

export function getBlobStoreId(token: string | undefined, variable: string) {
  if (!token) {
    throw new Error(`${variable} is not configured`);
  }

  const match = token.match(/^vercel_blob_rw_([^_]+)_/);
  if (!match?.[1]) {
    throw new Error(`${variable} is not a valid Vercel Blob write token`);
  }

  return match[1];
}

export function assertSafeBlobStores(
  tokens: BlobStoreTokens,
  options: BlobSafetyOptions = {},
) {
  const environment = options.environment ?? process.env.VERCEL_ENV ?? "local";
  const resourceEnvironment = getResourceEnvironment(environment);
  const publicStore = getBlobStoreId(
    tokens.publicToken,
    "BLOB_READ_WRITE_TOKEN",
  );
  const teamStore = getBlobStoreId(
    tokens.teamToken,
    "TEAM_FILES_BLOB_READ_WRITE_TOKEN",
  );
  const expected = blobStores[resourceEnvironment];

  if (publicStore !== expected.public || teamStore !== expected.team) {
    throw new Error(
      `Refusing to use Blob stores that do not belong to the ${resourceEnvironment} environment. Pull the correct environment from Vercel.`,
    );
  }

  return { publicStore, teamStore, environment: resourceEnvironment };
}

function getResourceEnvironment(environment: string): ResourceEnvironment {
  if (environment === "production" || environment === "preview") {
    return environment;
  }

  if (environment === "development" || environment === "local") {
    return "development";
  }

  throw new Error(`Unknown Vercel environment: ${environment}`);
}
