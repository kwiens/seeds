import { z } from "zod";

export const seedUpdateFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer"),
  body: z
    .string()
    .min(1, "Body is required")
    .max(20000, "Body must be 20,000 characters or fewer"),
});

export type SeedUpdateFormValues = z.infer<typeof seedUpdateFormSchema>;
