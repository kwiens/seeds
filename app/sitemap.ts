import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { seeds } from "@/lib/db/schema";

const BASE_URL = "https://seeds-cha.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const approvedSeeds = await db
    .select({
      id: seeds.id,
      updatedAt: seeds.updatedAt,
    })
    .from(seeds)
    .where(eq(seeds.status, "approved"));

  const seedEntries: MetadataRoute.Sitemap = approvedSeeds.map((seed) => ({
    url: `${BASE_URL}/seeds/${seed.id}`,
    lastModified: seed.updatedAt,
  }));

  return [
    { url: BASE_URL, lastModified: new Date() },
    { url: `${BASE_URL}/seeds/new` },
    ...seedEntries,
  ];
}
