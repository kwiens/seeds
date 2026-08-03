import { describe, expect, it } from "vitest";
import { budgetFormSchema } from "@/lib/validations/budget";

describe("budgetFormSchema", () => {
  const validData = {
    lineItems: [
      { label: "Labor", amount: 5000 },
      { label: "Materials", amount: 3000 },
    ],
    notes: "Budget for community project",
    isPublic: true,
  };

  it("accepts valid budget data", () => {
    const result = budgetFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts empty lineItems array", () => {
    const result = budgetFormSchema.safeParse({
      lineItems: [],
      notes: "No items",
      isPublic: false,
    });
    expect(result.success).toBe(true);
  });

  it("defaults lineItems to empty array", () => {
    const result = budgetFormSchema.safeParse({ isPublic: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lineItems).toEqual([]);
    }
  });

  it("defaults isPublic to false", () => {
    const result = budgetFormSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublic).toBe(false);
    }
  });

  it("defaults notes to undefined", () => {
    const result = budgetFormSchema.safeParse({ lineItems: [] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBeUndefined();
    }
  });

  describe("lineItems array", () => {
    it("rejects lineItems with more than 100 items", () => {
      const items = Array.from({ length: 101 }, (_, i) => ({
        label: `Item ${i}`,
        amount: 100,
      }));
      const result = budgetFormSchema.safeParse({
        ...validData,
        lineItems: items,
      });
      expect(result.success).toBe(false);
    });

    it("accepts lineItems with exactly 100 items", () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        label: `Item ${i}`,
        amount: 100,
      }));
      const result = budgetFormSchema.safeParse({
        ...validData,
        lineItems: items,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("lineItem label", () => {
    it("requires label to be non-empty", () => {
      const result = budgetFormSchema.safeParse({
        ...validData,
        lineItems: [{ label: "", amount: 1000 }],
      });
      expect(result.success).toBe(false);
    });

    it("rejects label longer than 200 characters", () => {
      const result = budgetFormSchema.safeParse({
        ...validData,
        lineItems: [{ label: "a".repeat(201), amount: 1000 }],
      });
      expect(result.success).toBe(false);
    });

    it("accepts label at exactly 200 characters", () => {
      const result = budgetFormSchema.safeParse({
        ...validData,
        lineItems: [{ label: "a".repeat(200), amount: 1000 }],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("lineItem amount", () => {
    it("requires amount to be at least 0", () => {
      const result = budgetFormSchema.safeParse({
        ...validData,
        lineItems: [{ label: "Cost", amount: -1 }],
      });
      expect(result.success).toBe(false);
    });

    it("accepts amount at exactly 0", () => {
      const result = budgetFormSchema.safeParse({
        ...validData,
        lineItems: [{ label: "Cost", amount: 0 }],
      });
      expect(result.success).toBe(true);
    });

    it("rejects amount exceeding 10,000,000", () => {
      const result = budgetFormSchema.safeParse({
        ...validData,
        lineItems: [{ label: "Cost", amount: 10_000_001 }],
      });
      expect(result.success).toBe(false);
    });

    it("accepts amount at exactly 10,000,000", () => {
      const result = budgetFormSchema.safeParse({
        ...validData,
        lineItems: [{ label: "Cost", amount: 10_000_000 }],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("notes field", () => {
    it("accepts notes as optional", () => {
      const result = budgetFormSchema.safeParse({
        ...validData,
        notes: undefined,
      });
      expect(result.success).toBe(true);
    });

    it("rejects notes longer than 5000 characters", () => {
      const result = budgetFormSchema.safeParse({
        ...validData,
        notes: "a".repeat(5001),
      });
      expect(result.success).toBe(false);
    });

    it("accepts notes at exactly 5000 characters", () => {
      const result = budgetFormSchema.safeParse({
        ...validData,
        notes: "a".repeat(5000),
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty string for notes", () => {
      const result = budgetFormSchema.safeParse({
        ...validData,
        notes: "",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("isPublic field", () => {
    it("accepts isPublic as true", () => {
      const result = budgetFormSchema.safeParse({
        ...validData,
        isPublic: true,
      });
      expect(result.success).toBe(true);
    });

    it("accepts isPublic as false", () => {
      const result = budgetFormSchema.safeParse({
        ...validData,
        isPublic: false,
      });
      expect(result.success).toBe(true);
    });
  });
});
