import { z } from "zod";

export const teamEventFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer"),
  startsAt: z.coerce
    .date()
    .refine(
      (date) => date.getTime() > Date.now(),
      "Event must be in the future",
    ),
  location: z
    .string()
    .max(300, "Location must be 300 characters or fewer")
    .optional(),
});

export type TeamEventFormValues = z.infer<typeof teamEventFormSchema>;
