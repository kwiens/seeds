import { z } from "zod";

function hasText(node: Record<string, unknown>, depth = 0): boolean {
  if (depth > 20) return false;
  if (typeof node.text === "string" && node.text.trim().length > 0) return true;
  if (Array.isArray(node.content)) {
    return node.content.some(
      (child) =>
        typeof child === "object" &&
        child !== null &&
        hasText(child as Record<string, unknown>, depth + 1),
    );
  }
  return false;
}

const tiptapDocSchema = z
  .object({
    type: z.literal("doc"),
    content: z.array(z.record(z.string(), z.unknown())),
  })
  .passthrough()
  .refine((doc) => doc.content.some(hasText), "Body is required");

export const seedUpdateFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer"),
  body: tiptapDocSchema,
  photos: z.array(z.string().url()).max(6).default([]),
});

export type SeedUpdateFormValues = z.infer<typeof seedUpdateFormSchema>;
