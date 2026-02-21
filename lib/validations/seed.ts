import { z } from "zod";

export const seedFormSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(160, "Project name must be 160 characters or fewer"),
  summary: z
    .string()
    .min(1, "Summary is required")
    .max(10000, "Summary must be 10,000 characters or fewer"),
  gardeners: z.array(z.string().max(200)).max(50).default([]),
  locationAddress: z.string().optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  category: z.enum([
    "daily_access",
    "outdoor_play",
    "balanced_growth",
    "respect",
    "connected_communities",
  ]),
  roots: z.array(z.string().max(200)).max(50).default([]),
  supportPeople: z.array(z.string().max(200)).max(50).default([]),
  waterHave: z.array(z.string().max(200)).max(50).default([]),
  waterNeed: z.array(z.string().max(200)).max(50).default([]),
});

export type SeedFormValues = z.infer<typeof seedFormSchema>;
