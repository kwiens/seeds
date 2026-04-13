import { describe, expect, it } from "vitest";
import { seedUpdateFormSchema } from "@/lib/validations/seed-update";

describe("seedUpdateFormSchema", () => {
  const validBody = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Great progress!" }],
      },
    ],
  };

  const validData = {
    title: "Progress Update",
    body: validBody,
  };

  it("accepts valid update data", () => {
    const result = seedUpdateFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("requires title", () => {
    const result = seedUpdateFormSchema.safeParse({ ...validData, title: "" });
    expect(result.success).toBe(false);
  });

  it("requires body content", () => {
    const result = seedUpdateFormSchema.safeParse({
      ...validData,
      body: { type: "doc", content: [] },
    });
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

  it("rejects plain string body", () => {
    const result = seedUpdateFormSchema.safeParse({
      ...validData,
      body: "a plain string",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(seedUpdateFormSchema.safeParse({}).success).toBe(false);
    expect(seedUpdateFormSchema.safeParse({ title: "hi" }).success).toBe(false);
    expect(seedUpdateFormSchema.safeParse({ body: validBody }).success).toBe(
      false,
    );
  });
});
