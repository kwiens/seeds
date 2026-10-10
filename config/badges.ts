/**
 * Status badges admins can pin to a project ("Funded", "Needs Volunteers").
 *
 * Stored as a JSON array of keys on each project, so renaming or adding a
 * badge needs no migration. Remove a key only after clearing it from projects.
 */
import {
  Banknote,
  Building2,
  HandHelping,
  HardHat,
  type LucideIcon,
} from "lucide-react";

export interface BadgeInfo {
  label: string;
  icon: LucideIcon;
  color: string;
  bgClass: string;
  textClass: string;
}

export const badges = {
  funded: {
    label: "Funded",
    icon: Banknote,
    color: "emerald",
    bgClass: "bg-emerald-100 dark:bg-emerald-900/30",
    textClass: "text-emerald-700 dark:text-emerald-300",
  },
  in_construction: {
    label: "In Construction",
    icon: HardHat,
    color: "orange",
    bgClass: "bg-orange-100 dark:bg-orange-900/30",
    textClass: "text-orange-700 dark:text-orange-300",
  },
  needs_volunteers: {
    label: "Needs Volunteers",
    icon: HandHelping,
    color: "violet",
    bgClass: "bg-violet-100 dark:bg-violet-900/30",
    textClass: "text-violet-700 dark:text-violet-300",
  },
  city_partnership: {
    label: "City Partnership",
    icon: Building2,
    color: "slate",
    bgClass: "bg-slate-100 dark:bg-slate-900/30",
    textClass: "text-slate-700 dark:text-slate-300",
  },
} satisfies Record<string, BadgeInfo>;

export type BadgeKey = keyof typeof badges;

export const badgeKeys = Object.keys(badges) as BadgeKey[];
