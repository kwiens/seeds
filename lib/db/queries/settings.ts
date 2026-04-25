import { eq, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";

export const BANNER_CACHE_TAG = "banner";

export const BANNER_SETTING_KEYS = {
  enabled: "banner_enabled",
  message: "banner_message",
  href: "banner_href",
} as const;

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

// Cached because the banner renders in the root layout — a naive read would
// hit the DB on every request site-wide. Tag-invalidated by setBannerConfig.
export const getBannerConfig = unstable_cache(
  async (): Promise<BannerConfig> => {
    const rows = await getSiteSettings(Object.values(BANNER_SETTING_KEYS));
    return {
      enabled: rows[BANNER_SETTING_KEYS.enabled] === "true",
      message: rows[BANNER_SETTING_KEYS.message] ?? "",
      href: rows[BANNER_SETTING_KEYS.href] ?? "",
    };
  },
  ["banner-config"],
  { tags: [BANNER_CACHE_TAG] },
);
