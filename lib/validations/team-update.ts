import { z } from "zod";
import { TEAM_UPDATE_MAX_LENGTH } from "@/lib/constants";

const attachmentSchema = z.object({
  name: z.string().min(1).max(300),
  url: z.string().url(),
  size: z.number().min(0),
});

export const teamUpdateFormSchema = z.object({
  title: z
    .string()
    .trim()
    .max(200, "Title must be 200 characters or fewer")
    .optional(),
  body: z
    .string()
    .trim()
    .min(1, "Update is required")
    .max(
      TEAM_UPDATE_MAX_LENGTH,
      `Update must be ${TEAM_UPDATE_MAX_LENGTH.toLocaleString()} characters or fewer`,
    ),
  attachments: z.array(attachmentSchema).max(5).default([]),
});

export type TeamUpdateFormValues = z.infer<typeof teamUpdateFormSchema>;

export const teamUpdateReplyFormSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Reply is required")
    .max(
      TEAM_UPDATE_MAX_LENGTH,
      `Reply must be ${TEAM_UPDATE_MAX_LENGTH.toLocaleString()} characters or fewer`,
    ),
  attachments: z.array(attachmentSchema).max(5).default([]),
});

export type TeamUpdateReplyFormValues = z.infer<
  typeof teamUpdateReplyFormSchema
>;
