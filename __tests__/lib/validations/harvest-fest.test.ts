import { describe, expect, it } from "vitest";
import {
  formatHarvestFestIssue,
  harvestFestEventSchema,
  harvestFestPageSchema,
} from "@/lib/validations/harvest-fest";

const event = {
  date: "October 3",
  time: "12–2 PM",
  title: "Eco Tours",
  location: "",
  description: "Come see the goats.",
};

describe("harvestFestEventSchema", () => {
  it("accepts an event with only the required fields", () => {
    expect(harvestFestEventSchema.safeParse(event).success).toBe(true);
  });

  it("rejects an event missing its description", () => {
    expect(
      harvestFestEventSchema.safeParse({ ...event, description: undefined })
        .success,
    ).toBe(false);
  });

  it("rejects more than six photos", () => {
    const imageUrls = Array.from(
      { length: 7 },
      (_, i) => `https://example.com/${i}.jpg`,
    );
    expect(
      harvestFestEventSchema.safeParse({ ...event, imageUrls }).success,
    ).toBe(false);
  });
});

describe("formatHarvestFestIssue", () => {
  it("prefixes event issues with the 1-based event number", () => {
    const result = harvestFestPageSchema.safeParse({
      title: "Fest",
      tagline: "",
      intro: "",
      events: [event, event, { ...event, title: "" }],
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(formatHarvestFestIssue(result.error.issues[0])).toBe(
      "Event 3: Title is required",
    );
  });

  it("leaves page-level issues unprefixed", () => {
    const result = harvestFestPageSchema.safeParse({
      title: "",
      tagline: "",
      intro: "",
      events: [],
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(formatHarvestFestIssue(result.error.issues[0])).toBe(
      "Page title is required",
    );
  });
});
