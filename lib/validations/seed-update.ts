import { z } from "zod";

const tiptapDocSchema = z
  .object({
    type: z.literal("doc"),
    content: z
      .array(z.record(z.string(), z.unknown()))
      .min(1, "Body is required"),
  })
  .passthrough();

export const seedUpdateFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer"),
  body: tiptapDocSchema,
});

export type SeedUpdateFormValues = z.infer<typeof seedUpdateFormSchema>;
