import { participantRoleEnum, participantStateEnum } from "@/lib/db/schema";

export type ParticipantRole = (typeof participantRoleEnum.enumValues)[number];
export type ParticipantState = (typeof participantStateEnum.enumValues)[number];

export type TeamRole = Exclude<ParticipantRole, "supporter" | "gardener">;

export const teamRoleLabels: Record<TeamRole, string> = {
  member: "Team member",
  steward: "City/County Steward",
  co_gardener: "co-Gardener",
  guide: "Guide",
  roots: "Roots",
  cultivator: "Contributor",
};

export const participantRoleLabels: Record<ParticipantRole, string> = {
  supporter: "Supporter",
  gardener: "Gardener",
  ...teamRoleLabels,
};

export const teamRoleKeys = Object.keys(teamRoleLabels) as TeamRole[];

export const teamAccessRoles: ParticipantRole[] = ["gardener", ...teamRoleKeys];
