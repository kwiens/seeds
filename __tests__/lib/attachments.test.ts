import { describe, expect, it } from "vitest";
import { isImageAttachment } from "@/lib/attachments";

describe("isImageAttachment", () => {
  it.each([
    "photo.png",
    "photo.jpg",
    "photo.jpeg",
    "photo.webp",
    "photo.gif",
    "PHOTO.PNG",
  ])("treats %s as an image", (name) => {
    expect(isImageAttachment(name)).toBe(true);
  });

  it.each([
    "plan.pdf",
    "budget.xlsx",
    "notes.docx",
    "report",
    "image.psd",
  ])("does not treat %s as an image", (name) => {
    expect(isImageAttachment(name)).toBe(false);
  });
});
