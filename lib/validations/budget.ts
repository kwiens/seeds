import { z } from "zod";

export const budgetFormSchema = z.object({
  lineItems: z
    .array(
      z.object({
        label: z.string().min(1, "Line item needs a label").max(200),
        amount: z.number().min(0).max(10_000_000),
      }),
    )
    .max(100)
    .default([]),
  notes: z.string().max(5000).optional(),
  isPublic: z.boolean().default(false),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;
