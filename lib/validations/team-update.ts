import { z } from "zod";
import { TEAM_UPDATE_MAX_LENGTH } from "@/lib/constants";

export const teamUpdateFormSchema = z.object({
  title: z
    .string()
    .max(200, "Title must be 200 characters or fewer")
    .optional(),
  body: z
    .string()
    .min(1, "Update is required")
    .max(
      TEAM_UPDATE_MAX_LENGTH,
      `Update must be ${TEAM_UPDATE_MAX_LENGTH.toLocaleString()} characters or fewer`,
    ),
});

export type TeamUpdateFormValues = z.infer<typeof teamUpdateFormSchema>;

export const teamUpdateReplyFormSchema = z.object({
  body: z
    .string()
    .min(1, "Reply is required")
    .max(
      TEAM_UPDATE_MAX_LENGTH,
      `Reply must be ${TEAM_UPDATE_MAX_LENGTH.toLocaleString()} characters or fewer`,
    ),
});

export type TeamUpdateReplyFormValues = z.infer<
  typeof teamUpdateReplyFormSchema
>;
