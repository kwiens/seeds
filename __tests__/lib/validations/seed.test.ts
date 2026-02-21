import { describe, expect, it } from "vitest";
import { seedFormSchema } from "@/lib/validations/seed";

describe("seedFormSchema", () => {
  it("accepts valid seed data", () => {
    const result = seedFormSchema.safeParse({
      name: "Community Garden",
      summary: "A garden for the neighborhood.",
      category: "daily_access",
      gardeners: ["Alice", "Bob"],
      roots: [],
      supportPeople: [],
      waterHave: ["Tools"],
      waterNeed: ["Seeds"],
    });
    expect(result.success).toBe(true);
  });

  it("requires name", () => {
    const result = seedFormSchema.safeParse({
      name: "",
      summary: "A garden.",
      category: "daily_access",
    });
    expect(result.success).toBe(false);
  });

  it("enforces name max length", () => {
    const result = seedFormSchema.safeParse({
      name: "a".repeat(161),
      summary: "A garden.",
      category: "daily_access",
    });
    expect(result.success).toBe(false);
  });

  it("enforces summary max length", () => {
    const result = seedFormSchema.safeParse({
      name: "Garden",
      summary: "a".repeat(10001),
      category: "daily_access",
    });
    expect(result.success).toBe(false);
  });

  it("requires valid category", () => {
    const result = seedFormSchema.safeParse({
      name: "Garden",
      summary: "A garden.",
      category: "invalid_category",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid categories", () => {
    const validCategories = [
      "daily_access",
      "outdoor_play",
      "balanced_growth",
      "respect",
      "connected_communities",
    ];
    for (const category of validCategories) {
      const result = seedFormSchema.safeParse({
        name: "Test",
        summary: "Test summary.",
        category,
      });
      expect(result.success).toBe(true);
    }
  });

  it("defaults arrays to empty", () => {
    const result = seedFormSchema.safeParse({
      name: "Test",
      summary: "Test summary.",
      category: "respect",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gardeners).toEqual([]);
      expect(result.data.roots).toEqual([]);
      expect(result.data.waterHave).toEqual([]);
      expect(result.data.waterNeed).toEqual([]);
    }
  });
});
