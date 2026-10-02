import { z } from "zod";

export const harvestFestEventSchema = z.object({
  date: z.string().trim().min(1, "Date is required").max(40),
  time: z.string().trim().min(1, "Time is required").max(40),
  title: z.string().trim().min(1, "Title is required").max(100),
  location: z.string().trim().max(150),
  description: z.string().trim().min(1, "Description is required").max(600),
  details: z.string().trim().max(3000).optional(),
  imageUrls: z.array(z.string().trim().url()).max(6).optional(),
  projectId: z.string().uuid().optional(),
  projectName: z.string().trim().max(100).optional(),
});

export const harvestFestPageSchema = z.object({
  title: z.string().trim().min(1, "Page title is required").max(100),
  tagline: z.string().trim().max(100),
  intro: z.string().trim().max(1000),
  events: z.array(harvestFestEventSchema).max(40),
});

/** Prefixes event-level issues with the event's number so admins can find it. */
export function formatHarvestFestIssue(issue: z.core.$ZodIssue): string {
  const [section, index] = issue.path;
  if (section === "events" && typeof index === "number") {
    return `Event ${index + 1}: ${issue.message}`;
  }
  return issue.message;
}
