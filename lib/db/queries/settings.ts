import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";

export async function getSiteSetting(key: string): Promise<string | null> {
  try {
    const result = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, key))
      .limit(1);
    return result[0]?.value ?? null;
  } catch {
    // Table may not exist yet before migration is run
    return null;
  }
}

export async function getHomepagePhase(): Promise<1 | 2> {
  const value = await getSiteSetting("homepage_phase");
  return value === "2" ? 2 : 1;
}
