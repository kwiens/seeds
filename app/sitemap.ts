import type { MetadataRoute } from "next";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { seeds } from "@/lib/db/schema";

const BASE_URL = "https://www.npcseeds.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Exclude pending — submitting unreviewed ideas to search indexing would
  // leak moderation. Draft and archived are already non-public.
  const publicSeeds = await db
    .select({
      id: seeds.id,
      updatedAt: seeds.updatedAt,
    })
    .from(seeds)
    .where(
      inArray(seeds.status, ["approved", "in_progress", "in_maintenance"]),
    );

  const seedEntries: MetadataRoute.Sitemap = publicSeeds.map((seed) => ({
    url: `${BASE_URL}/seeds/${seed.id}`,
    lastModified: seed.updatedAt,
  }));

  return [
    { url: BASE_URL, lastModified: new Date() },
    { url: `${BASE_URL}/seeds/new` },
    ...seedEntries,
  ];
}
