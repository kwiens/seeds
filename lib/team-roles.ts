import { teamRoleEnum } from "@/lib/db/schema";

export type TeamRole = (typeof teamRoleEnum.enumValues)[number];

export const teamRoleLabels: Record<TeamRole, string> = {
  steward: "City/County Steward",
  co_gardener: "co-Gardener",
  guide: "Guide",
  roots: "Roots",
  cultivator: "Community Volunteer",
};

export const teamRoleKeys = Object.keys(teamRoleLabels) as TeamRole[];
