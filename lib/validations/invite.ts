import { z } from "zod";
import { teamRoleKeys } from "@/lib/participant-roles";

export const createInviteFormSchema = z.object({
  invitedName: z
    .string()
    .trim()
    .min(1, "Enter the person's name")
    .max(200, "Name must be 200 characters or fewer"),
  role: z.enum(teamRoleKeys as [string, ...string[]]),
});

export type CreateInviteFormValues = z.infer<typeof createInviteFormSchema>;
