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

/** Roles that may edit the project and run its team. */
export const managementRoles: ParticipantRole[] = ["gardener", "co_gardener"];

/** Roles that may enter the private team workspace. */
export const teamAccessRoles: ParticipantRole[] = ["gardener", ...teamRoleKeys];

/** Roles the project form captures as free-text names (no account needed). */
export const formParticipantRoles = ["gardener", "roots", "guide"] as const;
