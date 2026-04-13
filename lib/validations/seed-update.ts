import { z } from "zod";
import { extractPlainText } from "@/lib/tiptap";

const tiptapDocSchema = z
  .object({
    type: z.literal("doc"),
    content: z.array(z.record(z.string(), z.unknown())),
  })
  .passthrough()
  .refine((doc) => extractPlainText(doc).trim().length > 0, "Body is required");

export const seedUpdateFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer"),
  body: tiptapDocSchema,
  photos: z.array(z.string().url()).max(6).default([]),
});

export type SeedUpdateFormValues = z.infer<typeof seedUpdateFormSchema>;
