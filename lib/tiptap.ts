import type { JSONContent } from "@tiptap/react";

/**
 * Server-safe Tiptap JSON to HTML renderer.
 * Supports our limited schema: paragraphs, headings, bold, italic, code,
 * bullet lists, and list items.
 */
export function renderTiptapHTML(json: unknown): string {
  return renderNode(json as JSONContent);
}

export function extractPlainText(json: unknown): string {
  return extractText(json as JSONContent);
}

function renderNode(node: JSONContent): string {
  if (node.type === "text") {
    let html = escapeHtml(node.text ?? "");
    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case "bold":
            html = `<strong>${html}</strong>`;
            break;
          case "italic":
            html = `<em>${html}</em>`;
            break;
          case "code":
            html = `<code>${html}</code>`;
            break;
        }
      }
    }
    return html;
  }

  const children = (node.content ?? []).map(renderNode).join("");

  switch (node.type) {
    case "doc":
      return children;
    case "paragraph":
      return `<p>${children || "<br>"}</p>`;
    case "heading": {
      const raw = Number(node.attrs?.level);
      const level = [1, 2, 3].includes(raw) ? raw : 1;
      return `<h${level}>${children}</h${level}>`;
    }
    case "bulletList":
      return `<ul>${children}</ul>`;
    case "listItem":
      return `<li>${children}</li>`;
    case "hardBreak":
      return "<br>";
    default:
      return children;
  }
}

const BLOCK_TYPES = new Set(["paragraph", "heading", "bulletList", "listItem"]);

function extractText(node: JSONContent): string {
  if (node.text) return node.text;
  if (!node.content) return "";
  const separator = BLOCK_TYPES.has(node.type ?? "") ? "\n" : "";
  return node.content.map(extractText).join(separator).trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
