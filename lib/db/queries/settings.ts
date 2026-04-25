import { inArray } from "drizzle-orm";
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

async function getSiteSettings(
  keys: string[],
): Promise<Record<string, string>> {
  try {
    const rows = await db
      .select({ key: siteSettings.key, value: siteSettings.value })
      .from(siteSettings)
      .where(inArray(siteSettings.key, keys));
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

export async function getHomepagePhase(): Promise<1 | 2> {
  const value = await getSiteSetting("homepage_phase");
  return value === "2" ? 2 : 1;
}

export interface BannerConfig {
  enabled: boolean;
  message: string;
  href: string;
}

export async function getBannerConfig(): Promise<BannerConfig> {
  const rows = await getSiteSettings([
    "banner_enabled",
    "banner_message",
    "banner_href",
  ]);
  return {
    enabled: rows.banner_enabled === "true",
    message: rows.banner_message ?? "",
    href: rows.banner_href ?? "",
  };
}
