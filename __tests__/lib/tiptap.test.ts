import { describe, expect, it } from "vitest";
import { renderTiptapHTML, extractPlainText } from "@/lib/tiptap";

const doc = (
  ...content: Record<string, unknown>[]
): Record<string, unknown> => ({
  type: "doc",
  content,
});

const p = (...content: Record<string, unknown>[]): Record<string, unknown> => ({
  type: "paragraph",
  content,
});

const text = (
  t: string,
  marks?: { type: string }[],
): Record<string, unknown> => ({
  type: "text",
  text: t,
  ...(marks ? { marks } : {}),
});

describe("renderTiptapHTML", () => {
  it("renders a simple paragraph", () => {
    expect(renderTiptapHTML(doc(p(text("Hello"))))).toBe("<p>Hello</p>");
  });

  it("renders bold, italic, and code marks", () => {
    const result = renderTiptapHTML(
      doc(
        p(
          text("bold", [{ type: "bold" }]),
          text(" "),
          text("italic", [{ type: "italic" }]),
          text(" "),
          text("code", [{ type: "code" }]),
        ),
      ),
    );
    expect(result).toBe(
      "<p><strong>bold</strong> <em>italic</em> <code>code</code></p>",
    );
  });

  it("renders headings with valid levels", () => {
    expect(
      renderTiptapHTML(
        doc({ type: "heading", attrs: { level: 1 }, content: [text("H1")] }),
      ),
    ).toBe("<h1>H1</h1>");
    expect(
      renderTiptapHTML(
        doc({ type: "heading", attrs: { level: 2 }, content: [text("H2")] }),
      ),
    ).toBe("<h2>H2</h2>");
    expect(
      renderTiptapHTML(
        doc({ type: "heading", attrs: { level: 3 }, content: [text("H3")] }),
      ),
    ).toBe("<h3>H3</h3>");
  });

  it("sanitizes heading level to prevent XSS", () => {
    const malicious = doc({
      type: "heading",
      attrs: { level: '1 onclick="alert(1)"' },
      content: [text("XSS")],
    });
    expect(renderTiptapHTML(malicious)).toBe("<h1>XSS</h1>");
  });

  it("defaults invalid heading levels to h1", () => {
    expect(
      renderTiptapHTML(
        doc({ type: "heading", attrs: { level: 99 }, content: [text("X")] }),
      ),
    ).toBe("<h1>X</h1>");
    expect(
      renderTiptapHTML(
        doc({ type: "heading", attrs: {}, content: [text("X")] }),
      ),
    ).toBe("<h1>X</h1>");
  });

  it("renders bullet lists", () => {
    const result = renderTiptapHTML(
      doc({
        type: "bulletList",
        content: [
          { type: "listItem", content: [p(text("one"))] },
          { type: "listItem", content: [p(text("two"))] },
        ],
      }),
    );
    expect(result).toBe("<ul><li><p>one</p></li><li><p>two</p></li></ul>");
  });

  it("renders ordered lists", () => {
    const result = renderTiptapHTML(
      doc({
        type: "orderedList",
        content: [
          { type: "listItem", content: [p(text("first"))] },
          { type: "listItem", content: [p(text("second"))] },
        ],
      }),
    );
    expect(result).toBe("<ol><li><p>first</p></li><li><p>second</p></li></ol>");
  });

  it("renders empty paragraphs as <br>", () => {
    expect(renderTiptapHTML(doc({ type: "paragraph" }))).toBe("<p><br></p>");
  });

  it("escapes HTML in text content", () => {
    const result = renderTiptapHTML(
      doc(p(text('<script>alert("xss")</script>'))),
    );
    expect(result).toBe(
      "<p>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p>",
    );
  });

  it("escapes single quotes", () => {
    expect(renderTiptapHTML(doc(p(text("it's"))))).toBe("<p>it&#39;s</p>");
  });

  it("ignores unknown marks", () => {
    const result = renderTiptapHTML(
      doc(p(text("safe", [{ type: "unknown_mark" }]))),
    );
    expect(result).toBe("<p>safe</p>");
  });

  it("ignores unknown node types and renders their children", () => {
    const result = renderTiptapHTML(
      doc({ type: "unknownBlock", content: [p(text("inside"))] }),
    );
    expect(result).toBe("<p>inside</p>");
  });

  it("stops at max depth", () => {
    let node: Record<string, unknown> = p(text("deep"));
    for (let i = 0; i < 25; i++) {
      node = {
        type: "bulletList",
        content: [{ type: "listItem", content: [node] }],
      };
    }
    const result = renderTiptapHTML(doc(node));
    expect(result).not.toContain("deep");
  });

  it("handles null/undefined input", () => {
    expect(renderTiptapHTML(null)).toBe("");
    expect(renderTiptapHTML(undefined)).toBe("");
    expect(renderTiptapHTML("string")).toBe("");
  });
});

describe("extractPlainText", () => {
  it("extracts text from a simple paragraph", () => {
    expect(extractPlainText(doc(p(text("Hello world"))))).toBe("Hello world");
  });

  it("joins inline marks without separators", () => {
    const result = extractPlainText(
      doc(p(text("Hello "), text("world", [{ type: "bold" }]))),
    );
    expect(result).toBe("Hello world");
  });

  it("joins paragraphs with newlines", () => {
    const result = extractPlainText(doc(p(text("First")), p(text("Second"))));
    expect(result).toBe("First\nSecond");
  });

  it("joins list items with newlines", () => {
    const result = extractPlainText(
      doc({
        type: "bulletList",
        content: [
          { type: "listItem", content: [p(text("one"))] },
          { type: "listItem", content: [p(text("two"))] },
        ],
      }),
    );
    expect(result).toBe("one\ntwo");
  });

  it("handles empty documents", () => {
    expect(extractPlainText(doc())).toBe("");
    expect(extractPlainText(doc({ type: "paragraph" }))).toBe("");
  });

  it("stops at max depth", () => {
    let node: Record<string, unknown> = p(text("deep"));
    for (let i = 0; i < 25; i++) {
      node = {
        type: "bulletList",
        content: [{ type: "listItem", content: [node] }],
      };
    }
    expect(extractPlainText(doc(node))).toBe("");
  });

  it("handles null/undefined input", () => {
    expect(extractPlainText(null)).toBe("");
    expect(extractPlainText(undefined)).toBe("");
  });
});
