import { describe, expect, it } from "vitest";
import { isImageAttachment, isImageContentType } from "@/lib/attachments";

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

describe("isImageContentType", () => {
  it.each([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "IMAGE/PNG",
  ])("treats %s as a previewable image", (type) => {
    expect(isImageContentType(type)).toBe(true);
  });

  it.each([
    "application/pdf",
    "image/svg+xml",
    "text/html",
    "",
  ])("does not treat %s as a previewable image", (type) => {
    expect(isImageContentType(type)).toBe(false);
  });
});
