import { describe, expect, it } from "vitest";
import { generateQrSvg } from "@/lib/qr";

describe("generateQrSvg", () => {
  const url = "https://www.npcseeds.org/seeds/abc-123";
  const svg = generateQrSvg(url);

  it("returns valid SVG with correct root element", () => {
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it("uses rounded dots (arc commands) not square rects", () => {
    // Arc commands indicate circles; square modules would use h/v only
    expect(svg).toContain(",0,1,0,");
    expect(svg).not.toMatch(/M\d+,\d+h\d+v\d+h-\d+z/);
  });

  it("embeds the favicon paths in the center", () => {
    expect(svg).toContain('fill="#75BB23"');
    expect(svg).toContain('fill="#4285F4"');
    expect(svg).toContain('fill="#FF68FF"');
    expect(svg).toContain('fill="#FFD208"');
    expect(svg).toContain('fill="#FE6A46"');
  });

  it("includes a white background rect behind the favicon", () => {
    expect(svg).toMatch(/<rect[^>]+fill="white"[^>]*\/>/);
  });

  it("produces different SVGs for different URLs", () => {
    const other = generateQrSvg("https://www.npcseeds.org/seeds/xyz-999");
    expect(svg).not.toEqual(other);
  });
});
