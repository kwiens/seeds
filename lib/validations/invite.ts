import { z } from "zod";
import { teamRoleKeys } from "@/lib/participant-roles";

export const createInviteFormSchema = z.object({
  invitedName: z
    .string()
    .trim()
    .min(1, "Enter the person's name")
    .max(200, "Name must be 200 characters or fewer"),
  role: z.enum(teamRoleKeys),
});

export const createInviteActionSchema = createInviteFormSchema.extend({
  projectId: z.uuid("Project not found."),
});

export const cancelInviteActionSchema = z.object({
  inviteId: z.uuid("Invite not found."),
});

export const inviteTokenSchema = z
  .string()
  .length(32, "This invite link isn't valid.")
  .regex(/^[A-Za-z0-9_-]+$/, "This invite link isn't valid.");

export const acceptInviteActionSchema = z.object({
  token: inviteTokenSchema,
});

export type CreateInviteFormValues = z.infer<typeof createInviteFormSchema>;
