import { describe, expect, it } from "vitest";
import { teamUpdateFormSchema } from "@/lib/validations/team-update";

describe("teamUpdateFormSchema", () => {
  const validPrivateBlobUrl =
    "https://project-123-abc.private.blob.vercel-storage.com/files/document.pdf";

  const validData = {
    title: "Team Update",
    body: "Here is our progress this week.",
    attachments: [],
  };

  const validAttachment = {
    name: "report.pdf",
    url: validPrivateBlobUrl,
    size: 1024,
  };

  it("accepts valid update data", () => {
    const result = teamUpdateFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("requires body", () => {
    const result = teamUpdateFormSchema.safeParse({
      title: "Update",
      body: "",
      attachments: [],
    });
    expect(result.success).toBe(false);
  });

  it("requires body with non-whitespace content", () => {
    const result = teamUpdateFormSchema.safeParse({
      title: "Update",
      body: "   ",
      attachments: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts body with only content after trimming", () => {
    const result = teamUpdateFormSchema.safeParse({
      title: "Update",
      body: "   Real content   ",
      attachments: [],
    });
    expect(result.success).toBe(true);
  });

  describe("body field", () => {
    it("rejects body longer than 2000 characters", () => {
      const result = teamUpdateFormSchema.safeParse({
        title: "Update",
        body: "a".repeat(2001),
        attachments: [],
      });
      expect(result.success).toBe(false);
    });

    it("accepts body at exactly 2000 characters", () => {
      const result = teamUpdateFormSchema.safeParse({
        title: "Update",
        body: "a".repeat(2000),
        attachments: [],
      });
      expect(result.success).toBe(true);
    });

    it("trims whitespace from body", () => {
      const result = teamUpdateFormSchema.safeParse({
        title: "Update",
        body: "  content with spaces  ",
        attachments: [],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body).toBe("content with spaces");
      }
    });
  });

  describe("title field", () => {
    it("accepts title as optional", () => {
      const result = teamUpdateFormSchema.safeParse({
        body: "Some update content",
        attachments: [],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBeUndefined();
      }
    });

    it("accepts undefined title", () => {
      const result = teamUpdateFormSchema.safeParse({
        title: undefined,
        body: "Content",
        attachments: [],
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty string title", () => {
      const result = teamUpdateFormSchema.safeParse({
        title: "",
        body: "Content",
        attachments: [],
      });
      expect(result.success).toBe(true);
    });

    it("rejects title longer than 200 characters", () => {
      const result = teamUpdateFormSchema.safeParse({
        title: "a".repeat(201),
        body: "Content",
        attachments: [],
      });
      expect(result.success).toBe(false);
    });

    it("accepts title at exactly 200 characters", () => {
      const result = teamUpdateFormSchema.safeParse({
        title: "a".repeat(200),
        body: "Content",
        attachments: [],
      });
      expect(result.success).toBe(true);
    });

    it("trims whitespace from title", () => {
      const result = teamUpdateFormSchema.safeParse({
        title: "  Title Text  ",
        body: "Content",
        attachments: [],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Title Text");
      }
    });
  });

  describe("attachments array", () => {
    it("defaults attachments to empty array", () => {
      const result = teamUpdateFormSchema.safeParse({
        body: "Content",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.attachments).toEqual([]);
      }
    });

    it("accepts empty attachments array", () => {
      const result = teamUpdateFormSchema.safeParse({
        body: "Content",
        attachments: [],
      });
      expect(result.success).toBe(true);
    });

    it("accepts single attachment", () => {
      const result = teamUpdateFormSchema.safeParse({
        body: "Content",
        attachments: [validAttachment],
      });
      expect(result.success).toBe(true);
    });

    it("rejects more than 5 attachments", () => {
      const attachments = Array.from({ length: 6 }, (_, i) => ({
        ...validAttachment,
        name: `file-${i}.pdf`,
      }));
      const result = teamUpdateFormSchema.safeParse({
        body: "Content",
        attachments,
      });
      expect(result.success).toBe(false);
    });

    it("accepts exactly 5 attachments", () => {
      const attachments = Array.from({ length: 5 }, (_, i) => ({
        ...validAttachment,
        name: `file-${i}.pdf`,
      }));
      const result = teamUpdateFormSchema.safeParse({
        body: "Content",
        attachments,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("attachment validation", () => {
    it("requires attachment name", () => {
      const result = teamUpdateFormSchema.safeParse({
        body: "Content",
        attachments: [{ ...validAttachment, name: "" }],
      });
      expect(result.success).toBe(false);
    });

    it("rejects attachment name longer than 300 characters", () => {
      const result = teamUpdateFormSchema.safeParse({
        body: "Content",
        attachments: [{ ...validAttachment, name: "a".repeat(301) }],
      });
      expect(result.success).toBe(false);
    });

    it("accepts attachment name at exactly 300 characters", () => {
      const result = teamUpdateFormSchema.safeParse({
        body: "Content",
        attachments: [{ ...validAttachment, name: "a".repeat(300) }],
      });
      expect(result.success).toBe(true);
    });

    it("requires valid attachment URL", () => {
      const result = teamUpdateFormSchema.safeParse({
        body: "Content",
        attachments: [{ ...validAttachment, url: "not-a-url" }],
      });
      expect(result.success).toBe(false);
    });

    it("requires private blob URL format", () => {
      const result = teamUpdateFormSchema.safeParse({
        body: "Content",
        attachments: [
          {
            ...validAttachment,
            url: "https://example.com/file.pdf",
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid private blob URL", () => {
      const result = teamUpdateFormSchema.safeParse({
        body: "Content",
        attachments: [
          {
            ...validAttachment,
            url: "https://my-project.private.blob.vercel-storage.com/uploads/file.pdf",
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-https private blob URL", () => {
      const result = teamUpdateFormSchema.safeParse({
        body: "Content",
        attachments: [
          {
            ...validAttachment,
            url: "http://project.private.blob.vercel-storage.com/file.pdf",
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("requires non-negative attachment size", () => {
      const result = teamUpdateFormSchema.safeParse({
        body: "Content",
        attachments: [{ ...validAttachment, size: -1 }],
      });
      expect(result.success).toBe(false);
    });

    it("accepts zero-byte attachment", () => {
      const result = teamUpdateFormSchema.safeParse({
        body: "Content",
        attachments: [{ ...validAttachment, size: 0 }],
      });
      expect(result.success).toBe(true);
    });

    it("rejects attachment size exceeding max (20 MB)", () => {
      const maxSize = 20 * 1024 * 1024;
      const result = teamUpdateFormSchema.safeParse({
        body: "Content",
        attachments: [{ ...validAttachment, size: maxSize + 1 }],
      });
      expect(result.success).toBe(false);
    });

    it("accepts attachment at exactly max size (20 MB)", () => {
      const maxSize = 20 * 1024 * 1024;
      const result = teamUpdateFormSchema.safeParse({
        body: "Content",
        attachments: [{ ...validAttachment, size: maxSize }],
      });
      expect(result.success).toBe(true);
    });

    it("requires integer size", () => {
      const result = teamUpdateFormSchema.safeParse({
        body: "Content",
        attachments: [{ ...validAttachment, size: 1024.5 }],
      });
      expect(result.success).toBe(false);
    });

    it("accepts integer size", () => {
      const result = teamUpdateFormSchema.safeParse({
        body: "Content",
        attachments: [{ ...validAttachment, size: 1024 }],
      });
      expect(result.success).toBe(true);
    });
  });
});
