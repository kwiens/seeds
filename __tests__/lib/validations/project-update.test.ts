import { describe, expect, it } from "vitest";
import { projectUpdateFormSchema } from "@/lib/validations/project-update";

describe("projectUpdateFormSchema", () => {
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
    const result = projectUpdateFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("requires title", () => {
    const result = projectUpdateFormSchema.safeParse({
      ...validData,
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty content array", () => {
    const result = projectUpdateFormSchema.safeParse({
      ...validData,
      body: { type: "doc", content: [] },
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty paragraph (no visible text)", () => {
    const result = projectUpdateFormSchema.safeParse({
      ...validData,
      body: { type: "doc", content: [{ type: "paragraph" }] },
    });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only text", () => {
    const result = projectUpdateFormSchema.safeParse({
      ...validData,
      body: {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "   " }] },
        ],
      },
    });
    expect(result.success).toBe(false);
  });

  it("enforces title max length", () => {
    const result = projectUpdateFormSchema.safeParse({
      ...validData,
      title: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("accepts title at max length", () => {
    const result = projectUpdateFormSchema.safeParse({
      ...validData,
      title: "a".repeat(200),
    });
    expect(result.success).toBe(true);
  });

  it("rejects plain string body", () => {
    const result = projectUpdateFormSchema.safeParse({
      ...validData,
      body: "a plain string",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(projectUpdateFormSchema.safeParse({}).success).toBe(false);
    expect(projectUpdateFormSchema.safeParse({ title: "hi" }).success).toBe(
      false,
    );
    expect(projectUpdateFormSchema.safeParse({ body: validBody }).success).toBe(
      false,
    );
  });
});
