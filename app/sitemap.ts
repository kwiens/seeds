import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { indexableProject } from "@/lib/db/queries/filters";
import { projects } from "@/lib/db/schema";
import { routes } from "@/lib/routes";
import { CANONICAL_ORIGIN as BASE_URL } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Exclude pending — submitting unreviewed ideas to search indexing would
  // leak moderation. Draft and archived are already non-public.
  const publicSeeds = await db
    .select({
      id: projects.id,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(indexableProject());

  const seedEntries: MetadataRoute.Sitemap = publicSeeds.map((seed) => ({
    url: `${BASE_URL}${routes.project(seed.id)}`,
    lastModified: seed.updatedAt,
  }));

  return [
    { url: BASE_URL, lastModified: new Date() },
    { url: `${BASE_URL}${routes.newProject}` },
    ...seedEntries,
  ];
}
