/**
 * Site identity for this deployment.
 *
 * Every value here is specific to the city running this instance. A new city
 * edits this file (and the others in `config/`) and never needs to touch
 * `app/`, `components/` or `lib/`. See `config/README.md`.
 */

export interface SiteConfig {
  /** Full product name. Logo alt text, default page title, OpenGraph. */
  name: string;
  /** Short name used in the page title template: "Page | <shortName>". */
  shortName: string;
  /** One-line mission statement shown in the footer and the homepage. */
  tagline: string;
  /** Default meta description. */
  description: string;
  city: {
    name: string;
    /** State, province, or region. */
    region: string;
    /** ISO 3166-1 alpha-2, lowercase. Also restricts address search. */
    country: string;
    /** The organization or program this site belongs to. */
    organization: string;
  };
  /** Canonical public origin, no trailing slash. QR codes and exports use it. */
  origin: string;
  /** BCP 47 locale for dates and numbers. */
  locale: string;
  /** `<html lang>` value. */
  lang: string;
  /** IANA timezone for server-rendered dates. */
  timeZone: string;
  /** ISO 4217 currency for budgets. */
  currency: string;
  /** Public contact address shown on the FAQ page. */
  contactEmail: string;
  analytics: {
    /** Google Analytics measurement id, or null to disable. */
    googleAnalyticsId: string | null;
  };
  brand: {
    /** Square-ish logo for the header. Path under `public/`. */
    logo: { src: string; width: number; height: number };
    /** Wide logo for the footer. Path under `public/`. */
    logoHorizontal: { src: string; width: number; height: number };
    /** Social sharing image. Path under `public/`. */
    ogImage: { url: string; width: number; height: number; alt: string };
  };
  map: {
    /** Where maps open before any project is selected. */
    center: { latitude: number; longitude: number };
    /** Explorer map zoom. */
    zoom: number;
    /** Zoom for a single project's detail map. */
    detailZoom: number;
    /** Zoom for the location picker preview. */
    pickerZoom: number;
    /** Mapbox style URL. */
    style: string;
    /** Language for Mapbox address search results. */
    searchLanguage: string;
  };
  community: {
    /**
     * A pending project becomes approved automatically once it has this many
     * supporters. Set to null to require an admin for every approval.
     */
    autoApproveSupportThreshold: number | null;
  };
  features: {
    /**
     * The admin-editable public event page at /harvest-fest. Off by default
     * for new cities; see `docs/city-setup.md`.
     */
    harvestFest: boolean;
  };
  auth: {
    /** Name of the sign-in provider shown in prompts ("Sign in with Google"). */
    providerLabel: string;
  };
}

export const siteConfig: SiteConfig = {
  name: "National Park City Seeds",
  shortName: "Seeds",
  tagline: "We're growing the best place in the world to live.",
  description:
    "Grow the best place in the world to live. Community-led projects across Chattanooga.",
  city: {
    name: "Chattanooga",
    region: "Tennessee",
    country: "us",
    organization: "Chattanooga National Park City",
  },
  origin: "https://www.npcseeds.org",
  locale: "en-US",
  lang: "en",
  timeZone: "America/New_York",
  currency: "USD",
  contactEmail: "hello@nationalparkcitycha.org",
  analytics: {
    googleAnalyticsId: "G-X3QH16E5QV",
  },
  brand: {
    logo: { src: "/logo.svg", width: 137, height: 44 },
    logoHorizontal: { src: "/logo-horizontal.svg", width: 220, height: 20 },
    ogImage: {
      url: "/npc_landscape_chattanooga.jpg",
      width: 1000,
      height: 522,
      alt: "Chattanooga National Park City landscape",
    },
  },
  map: {
    center: { latitude: 35.0456, longitude: -85.3097 },
    zoom: 12,
    detailZoom: 13,
    pickerZoom: 14,
    style: "mapbox://styles/kwiens/cm6au0n48006h01s28k1p0faz",
    searchLanguage: "en",
  },
  community: {
    autoApproveSupportThreshold: 10,
  },
  features: {
    harvestFest: true,
  },
  auth: {
    providerLabel: "Google",
  },
};
