import { describe, expect, it } from "vitest";
import { seedUpdateFormSchema } from "@/lib/validations/seed-update";

describe("seedUpdateFormSchema", () => {
  const validData = {
    title: "Progress Update",
    body: "We made great progress this week.",
  };

  it("accepts valid update data", () => {
    const result = seedUpdateFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("requires title", () => {
    const result = seedUpdateFormSchema.safeParse({ ...validData, title: "" });
    expect(result.success).toBe(false);
  });

  it("requires body", () => {
    const result = seedUpdateFormSchema.safeParse({ ...validData, body: "" });
    expect(result.success).toBe(false);
  });

  it("enforces title max length", () => {
    const result = seedUpdateFormSchema.safeParse({
      ...validData,
      title: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("accepts title at max length", () => {
    const result = seedUpdateFormSchema.safeParse({
      ...validData,
      title: "a".repeat(200),
    });
    expect(result.success).toBe(true);
  });

  it("enforces body max length", () => {
    const result = seedUpdateFormSchema.safeParse({
      ...validData,
      body: "a".repeat(20001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts body at max length", () => {
    const result = seedUpdateFormSchema.safeParse({
      ...validData,
      body: "a".repeat(20000),
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing fields", () => {
    expect(seedUpdateFormSchema.safeParse({}).success).toBe(false);
    expect(seedUpdateFormSchema.safeParse({ title: "hi" }).success).toBe(false);
    expect(seedUpdateFormSchema.safeParse({ body: "hi" }).success).toBe(false);
  });
});
