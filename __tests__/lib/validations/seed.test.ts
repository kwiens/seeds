import { describe, expect, it } from "vitest";
import { seedFormSchema } from "@/lib/validations/seed";

describe("seedFormSchema", () => {
  const validData = {
    name: "Community Garden",
    summary: "A garden for the neighborhood.",
    category: "daily_access" as const,
    gardeners: ["Alice", "Bob"],
    roots: [],
    supportPeople: [],
    waterHave: ["Tools"],
    waterNeed: ["Seeds"],
    obstacles: "Need permits from the city.",
  };

  it("accepts valid seed data", () => {
    const result = seedFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("requires name", () => {
    const result = seedFormSchema.safeParse({ ...validData, name: "" });
    expect(result.success).toBe(false);
  });

  it("enforces name max length", () => {
    const result = seedFormSchema.safeParse({
      ...validData,
      name: "a".repeat(161),
    });
    expect(result.success).toBe(false);
  });

  it("enforces summary max length", () => {
    const result = seedFormSchema.safeParse({
      ...validData,
      summary: "a".repeat(10001),
    });
    expect(result.success).toBe(false);
  });

  it("requires valid category", () => {
    const result = seedFormSchema.safeParse({
      ...validData,
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
      const result = seedFormSchema.safeParse({ ...validData, category });
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

  it("accepts optional location fields", () => {
    const result = seedFormSchema.safeParse({
      ...validData,
      locationAddress: "123 Main St",
      locationLat: 35.0456,
      locationLng: -85.3097,
    });
    expect(result.success).toBe(true);
  });

  describe("array field limits", () => {
    const stringArrayFields = [
      "gardeners",
      "supportPeople",
      "waterHave",
      "waterNeed",
    ] as const;

    for (const field of stringArrayFields) {
      it(`rejects ${field} items longer than 200 characters`, () => {
        const result = seedFormSchema.safeParse({
          ...validData,
          [field]: ["a".repeat(201)],
        });
        expect(result.success).toBe(false);
      });

      it(`accepts ${field} items at exactly 200 characters`, () => {
        const result = seedFormSchema.safeParse({
          ...validData,
          [field]: ["a".repeat(200)],
        });
        expect(result.success).toBe(true);
      });

      it(`rejects ${field} with more than 50 items`, () => {
        const result = seedFormSchema.safeParse({
          ...validData,
          [field]: Array.from({ length: 51 }, (_, i) => `item-${i}`),
        });
        expect(result.success).toBe(false);
      });

      it(`accepts ${field} with exactly 50 items`, () => {
        const result = seedFormSchema.safeParse({
          ...validData,
          [field]: Array.from({ length: 50 }, (_, i) => `item-${i}`),
        });
        expect(result.success).toBe(true);
      });
    }

    it("rejects roots items with name longer than 200 characters", () => {
      const result = seedFormSchema.safeParse({
        ...validData,
        roots: [{ name: "a".repeat(201), committed: false }],
      });
      expect(result.success).toBe(false);
    });

    it("accepts roots items with name at exactly 200 characters", () => {
      const result = seedFormSchema.safeParse({
        ...validData,
        roots: [{ name: "a".repeat(200), committed: true }],
      });
      expect(result.success).toBe(true);
    });

    it("rejects roots with more than 50 items", () => {
      const result = seedFormSchema.safeParse({
        ...validData,
        roots: Array.from({ length: 51 }, (_, i) => ({
          name: `org-${i}`,
          committed: false,
        })),
      });
      expect(result.success).toBe(false);
    });

    it("accepts roots with exactly 50 items", () => {
      const result = seedFormSchema.safeParse({
        ...validData,
        roots: Array.from({ length: 50 }, (_, i) => ({
          name: `org-${i}`,
          committed: false,
        })),
      });
      expect(result.success).toBe(true);
    });
  });
});
