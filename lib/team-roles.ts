import { teamRoleEnum } from "@/lib/db/schema";

export type TeamRole = (typeof teamRoleEnum.enumValues)[number];

export const teamRoleLabels: Record<TeamRole, string> = {
  steward: "Steward",
  co_gardener: "co-Gardener",
  guide: "Guide",
  roots: "Roots",
  cultivator: "Sprout Cultivator",
};

export const teamRoleKeys = Object.keys(teamRoleLabels) as TeamRole[];
