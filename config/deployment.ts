/**
 * Identifiers for the hosting resources behind this deployment.
 *
 * These let the environment safety checks fail closed: the app refuses to
 * start against the Production database or Blob stores from anywhere except
 * a Production deployment, even if the wrong credentials are pulled. A new
 * city fills these in once after creating its Vercel project, Neon database
 * and Blob stores (see `docs/city-setup.md`).
 *
 * Keep this file free of secrets. Everything here is an identifier, not a
 * credential.
 */

export const vercelProject = {
  /** Team slug and project name, as used by `vercel link`. */
  scope: "chattanooga-seeds",
  name: "seeds",
  /** From `.vercel/project.json` after linking. Guards `pnpm env:setup`. */
  id: "prj_5aveWXn8kWvlnplpXBaZdg7k3kjC",
} as const;

/** The Neon endpoint id (host prefix) and database name of Production. */
export const productionDatabase = {
  endpoint: "ep-divine-tooth-aidea37t",
  database: "neondb",
} as const;

/**
 * Vercel Blob store ids per environment, taken from the middle segment of
 * each store's read-write token (`vercel_blob_rw_<storeId>_...`).
 */
export const blobStores = {
  production: {
    public: "0jJDVIhXX8wVN6Ty",
    team: "38MP9o7PJgK1kMRX",
  },
  development: {
    public: "cVJ0H9jPR61qF32Y",
    team: "YnFQQ1z8IihRdO43",
  },
  preview: {
    public: "MFfIAmz3VrsjECPX",
    team: "aqVq2NIWGjPAdnoW",
  },
} as const;

export type ResourceEnvironment = keyof typeof blobStores;
