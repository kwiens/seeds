import { Sparkles, Sprout, TreeDeciduous, type LucideIcon } from "lucide-react";

export type ProjectStage = "seed" | "sprout" | "tree";
export type ApprovalState = "draft" | "pending" | "approved";

export interface ProjectStageInfo {
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

export const projectStages: Record<ProjectStage, ProjectStageInfo> = {
  seed: {
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
  sprout: {
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
  tree: {
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

export const publicProjectStageOrder: ProjectStage[] = [
  "seed",
  "sprout",
  "tree",
];

const slugMap: Record<string, ProjectStage> = {
  seeds: "seed",
  sprouts: "sprout",
  trees: "tree",
};

export function slugToProjectStage(slug: string): ProjectStage | undefined {
  return slugMap[slug];
}

export function projectStageToSlug(stage: ProjectStage): string {
  return projectStages[stage].slug;
}

// Capabilities accumulate: Sprouts add the team workspace and Trees retain it.
export function hasTeamWorkspace(stage: ProjectStage): boolean {
  return stage === "sprout" || stage === "tree";
}

export function projectDisplayState(project: {
  stage: ProjectStage;
  approvalState: ApprovalState;
  archivedAt: Date | null;
}): string {
  if (project.archivedAt) return "Archived";
  if (project.approvalState === "draft")
    return `Draft ${projectStages[project.stage].label}`;
  if (project.approvalState === "pending")
    return `Pending ${projectStages[project.stage].label}`;
  return projectStages[project.stage].label;
}
