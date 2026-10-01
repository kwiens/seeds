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

export const HARVEST_FEST_CACHE_TAG = "harvest-fest";
export const HARVEST_FEST_SETTING_KEY = "harvest_fest_page";

export interface HarvestFestEvent {
  date: string;
  time: string;
  title: string;
  location: string;
  description: string;
  // Shown only once someone expands the card via "Learn more" -- longer
  // copy and photos don't belong in the always-visible summary.
  details?: string;
  imageUrls?: string[];
  // Denormalized on purpose -- this is a small, human-curated flyer, not a
  // live listing. If the linked project is later renamed, this event keeps
  // showing the name it had when it was linked, until an admin re-saves it.
  projectId?: string;
  projectName?: string;
}

export interface HarvestFestPage {
  title: string;
  tagline: string;
  intro: string;
  events: HarvestFestEvent[];
}

export const EMPTY_HARVEST_FEST_PAGE: HarvestFestPage = {
  title: "",
  tagline: "",
  intro: "",
  events: [],
};

// Cached because the public page reads this on every visit. Tag-invalidated
// by setHarvestFestPage. Falls back to an empty page if unset or malformed
// rather than erroring — the page itself decides how to render that.
export const getHarvestFestPage = unstable_cache(
  async (): Promise<HarvestFestPage> => {
    const value = await getSiteSetting(HARVEST_FEST_SETTING_KEY);
    if (!value) return EMPTY_HARVEST_FEST_PAGE;
    try {
      const parsed = JSON.parse(value);
      return {
        title: typeof parsed.title === "string" ? parsed.title : "",
        tagline: typeof parsed.tagline === "string" ? parsed.tagline : "",
        intro: typeof parsed.intro === "string" ? parsed.intro : "",
        events: Array.isArray(parsed.events) ? parsed.events : [],
      };
    } catch {
      return EMPTY_HARVEST_FEST_PAGE;
    }
  },
  ["harvest-fest-page"],
  { tags: [HARVEST_FEST_CACHE_TAG] },
);

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
