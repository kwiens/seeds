import {
  Network,
  Leaf,
  Sprout,
  Sun,
  Trees,
  type LucideIcon,
} from "lucide-react";

export type CategoryKey =
  | "daily_access"
  | "outdoor_play"
  | "balanced_growth"
  | "respect"
  | "connected_communities";

export interface CategoryInfo {
  label: string;
  icon: LucideIcon;
  color: string;
  bgClass: string;
  textClass: string;
  gradient: string;
}

export const categories: Record<CategoryKey, CategoryInfo> = {
  daily_access: {
    label: "Daily Access",
    icon: Sun,
    color: "emerald",
    bgClass: "bg-emerald-100 dark:bg-emerald-900/30",
    textClass: "text-emerald-700 dark:text-emerald-300",
    gradient: "from-emerald-400 to-emerald-600",
  },
  outdoor_play: {
    label: "Outdoor Play",
    icon: Trees,
    color: "lime",
    bgClass: "bg-lime-100 dark:bg-lime-900/30",
    textClass: "text-lime-700 dark:text-lime-300",
    gradient: "from-lime-400 to-green-600",
  },
  balanced_growth: {
    label: "Balanced Growth",
    icon: Sprout,
    color: "green",
    bgClass: "bg-green-100 dark:bg-green-900/30",
    textClass: "text-green-700 dark:text-green-300",
    gradient: "from-green-400 to-teal-600",
  },
  respect: {
    label: "Respect",
    icon: Leaf,
    color: "teal",
    bgClass: "bg-teal-100 dark:bg-teal-900/30",
    textClass: "text-teal-700 dark:text-teal-300",
    gradient: "from-teal-400 to-cyan-600",
  },
  connected_communities: {
    label: "Connected Communities",
    icon: Network,
    color: "amber",
    bgClass: "bg-amber-100 dark:bg-amber-900/30",
    textClass: "text-amber-700 dark:text-amber-300",
    gradient: "from-amber-400 to-orange-500",
  },
};

export const categoryKeys = Object.keys(categories) as CategoryKey[];
