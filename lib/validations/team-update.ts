import { z } from "zod";
import {
  TEAM_ATTACHMENT_MAX_FILES,
  TEAM_ATTACHMENT_MAX_SIZE,
  TEAM_UPDATE_MAX_LENGTH,
} from "@/lib/constants";

function isPrivateBlobUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".private.blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

const attachmentSchema = z.object({
  name: z.string().min(1).max(300),
  url: z.string().url().refine(isPrivateBlobUrl, "Invalid attachment URL"),
  size: z.number().int().min(0).max(TEAM_ATTACHMENT_MAX_SIZE),
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
  attachments: z
    .array(attachmentSchema)
    .max(TEAM_ATTACHMENT_MAX_FILES)
    .default([]),
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
  attachments: z
    .array(attachmentSchema)
    .max(TEAM_ATTACHMENT_MAX_FILES)
    .default([]),
});

export type TeamUpdateReplyFormValues = z.infer<
  typeof teamUpdateReplyFormSchema
>;

export function attachmentsBelongToSeed(
  attachments: { url: string }[],
  seedId: string,
) {
  const expectedPrefix = `/seeds/${seedId}/attachments/`;
  return attachments.every((attachment) =>
    new URL(attachment.url).pathname.startsWith(expectedPrefix),
  );
}
