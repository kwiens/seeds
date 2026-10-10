/**
 * Project categories for this city.
 *
 * Every project belongs to exactly one category. The keys are stored in the
 * database as plain text, so you can rename, add, or remove entries here
 * without a migration. Removing a key that existing projects still use will
 * make those projects fail to render; migrate their rows first.
 *
 * Chattanooga's defaults are the five National Park City commitments.
 */
import {
  Leaf,
  type LucideIcon,
  Network,
  Sprout,
  Sun,
  Trees,
} from "lucide-react";

export interface CategoryInfo {
  label: string;
  icon: LucideIcon;
  /** Tailwind color family name, for callers that build their own classes. */
  color: string;
  bgClass: string;
  textClass: string;
  gradient: string;
  /**
   * Optional longer copy shown on the About page. Leave both out and the
   * About page simply lists the category.
   */
  principle?: string;
  commitment?: string;
}

export const categories = {
  daily_access: {
    label: "Everyday Access",
    icon: Sun,
    color: "emerald",
    bgClass: "bg-emerald-100 dark:bg-emerald-900/30",
    textClass: "text-emerald-700 dark:text-emerald-300",
    gradient: "from-emerald-400 to-emerald-600",
    principle:
      "Nature is open and accessible to all — the best aspects of a city should be too.",
    commitment:
      "We commit to making nature easy to access and part of everyday life for people of all ages and backgrounds.",
  },
  outdoor_play: {
    label: "Outdoor Play",
    icon: Trees,
    color: "lime",
    bgClass: "bg-lime-100 dark:bg-lime-900/30",
    textClass: "text-lime-700 dark:text-lime-300",
    gradient: "from-lime-400 to-green-600",
    principle: "Nature is fun, joyful and beautiful — city life should be too.",
    commitment:
      "We commit to cultivating a culture that regularly experiences the fun, beauty, and wonder of the outdoors together.",
  },
  balanced_growth: {
    label: "Balanced Growth",
    icon: Sprout,
    color: "green",
    bgClass: "bg-green-100 dark:bg-green-900/30",
    textClass: "text-green-700 dark:text-green-300",
    gradient: "from-green-400 to-teal-600",
    principle:
      "Nature grows in balance with the whole ecosystem — a city should grow the same way.",
    commitment:
      "We commit to guiding growth and development using the principles of healthy, thriving, self-sustaining ecosystems.",
  },
  respect: {
    label: "Respect",
    icon: Leaf,
    color: "teal",
    bgClass: "bg-teal-100 dark:bg-teal-900/30",
    textClass: "text-teal-700 dark:text-teal-300",
    gradient: "from-teal-400 to-cyan-600",
    principle:
      "Nature is a living system that must be understood and cared for as a whole — a city should be too.",
    commitment:
      "We commit to understanding, respecting, and preserving the unique ecology, history, and cultural roots of this place.",
  },
  connected_communities: {
    label: "Connected Communities",
    icon: Network,
    color: "amber",
    bgClass: "bg-amber-100 dark:bg-amber-900/30",
    textClass: "text-amber-700 dark:text-amber-300",
    gradient: "from-amber-400 to-orange-500",
    principle: "Nature thrives through connection — so does a city.",
    commitment:
      "We commit to strengthening connections between people, neighborhoods, wildlife, and local systems.",
  },
} satisfies Record<string, CategoryInfo>;

export type CategoryKey = keyof typeof categories;

export const categoryKeys = Object.keys(categories) as CategoryKey[];

export function isCategoryKey(value: unknown): value is CategoryKey {
  return typeof value === "string" && value in categories;
}
