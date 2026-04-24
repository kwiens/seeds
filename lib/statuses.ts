import { Sparkles, Sprout, TreeDeciduous, type LucideIcon } from "lucide-react";

export type StatusKey =
  | "pending"
  | "approved"
  | "in_progress"
  | "in_maintenance";

export interface StatusInfo {
  label: string;
  pluralLabel: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgClass: string;
  textClass: string;
  sublabel: string;
  slug: string;
  badgeVariant: "default" | "secondary" | "outline" | "destructive";
}

export const statuses: Record<StatusKey, StatusInfo> = {
  pending: {
    label: "Seed",
    pluralLabel: "Seeds",
    description: "Community ideas gathering support.",
    icon: Sparkles,
    color: "emerald",
    bgClass: "bg-emerald-100 dark:bg-emerald-900/30",
    textClass: "text-emerald-700 dark:text-emerald-300",
    sublabel: "Gathering Resources",
    slug: "seeds",
    badgeVariant: "secondary",
  },
  approved: {
    label: "Seed",
    pluralLabel: "Seeds",
    description: "Community ideas gathering support.",
    icon: Sparkles,
    color: "emerald",
    bgClass: "bg-emerald-100 dark:bg-emerald-900/30",
    textClass: "text-emerald-700 dark:text-emerald-300",
    sublabel: "Gathering Resources",
    slug: "seeds",
    badgeVariant: "default",
  },
  in_progress: {
    label: "Sprout",
    pluralLabel: "Sprouts",
    description: "Projects actively underway.",
    icon: Sprout,
    color: "green",
    bgClass: "bg-green-100 dark:bg-green-900/30",
    textClass: "text-green-700 dark:text-green-300",
    sublabel: "Building",
    slug: "sprouts",
    badgeVariant: "default",
  },
  in_maintenance: {
    label: "Tree",
    pluralLabel: "Trees",
    description: "Successful projects now being maintained.",
    icon: TreeDeciduous,
    color: "teal",
    bgClass: "bg-teal-100 dark:bg-teal-900/30",
    textClass: "text-teal-700 dark:text-teal-300",
    sublabel: "Maintaining",
    slug: "trees",
    badgeVariant: "default",
  },
};

/** Public statuses ordered by maturity (least mature first).
 *  "pending" is merged into "approved" as one "Seeds" section. */
export const publicStatusOrder: StatusKey[] = [
  "approved",
  "in_progress",
  "in_maintenance",
];

/** Statuses that are grouped together under the "seeds" slug */
export const seedStatuses: StatusKey[] = ["pending", "approved"];

const slugMap: Record<string, StatusKey> = {
  seeds: "approved",
  sprouts: "in_progress",
  trees: "in_maintenance",
};

export function slugToStatusKey(slug: string): StatusKey | undefined {
  return slugMap[slug];
}

export function statusKeyToSlug(key: StatusKey): string {
  return statuses[key].slug;
}
