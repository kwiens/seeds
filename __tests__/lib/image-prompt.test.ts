import { describe, expect, it } from "vitest";
import { shortenTitle, buildImagePrompt } from "@/lib/image-prompt";

describe("shortenTitle", () => {
  it("returns short title (≤4 words) unchanged", () => {
    expect(shortenTitle("Community Garden")).toBe("Community Garden");
  });

  it("returns last 3 words for 5+ word title", () => {
    expect(shortenTitle("The Great Big Community Garden")).toBe(
      "Big Community Garden",
    );
  });

  it("strips 'near X' suffix", () => {
    expect(shortenTitle("Garden near Downtown")).toBe("Garden");
  });

  it("strips 'at X' suffix", () => {
    expect(shortenTitle("Garden at the Park")).toBe("Garden");
  });

  it("strips 'on X' suffix", () => {
    expect(shortenTitle("Trail on Lookout Mountain")).toBe("Trail");
  });

  it("strips 'beside X' suffix", () => {
    expect(shortenTitle("Trail beside the River")).toBe("Trail");
  });

  it("strips 'along X' suffix", () => {
    expect(shortenTitle("Path along the Creek")).toBe("Path");
  });

  it("strips 'from X' suffix", () => {
    expect(shortenTitle("View from Signal Mountain")).toBe("View");
  });

  it("strips location suffix case-insensitively", () => {
    expect(shortenTitle("Garden NEAR Downtown")).toBe("Garden");
  });

  it("handles empty string", () => {
    expect(shortenTitle("")).toBe("");
  });
});

describe("buildImagePrompt", () => {
  const baseSeed = {
    name: "Community Garden",
    summary: "A garden for the neighborhood.",
    locationAddress: null,
    waterHave: [],
  };

  it("contains shortened title", () => {
    const prompt = buildImagePrompt(baseSeed);
    expect(prompt).toContain("Title: Community Garden");
  });

  it("truncates summary to 500 chars", () => {
    const longSummary = "A".repeat(600);
    const prompt = buildImagePrompt({ ...baseSeed, summary: longSummary });
    expect(prompt).toContain("A".repeat(500));
    expect(prompt).not.toContain("A".repeat(501));
  });

  it("includes location line when address is set", () => {
    const prompt = buildImagePrompt({
      ...baseSeed,
      locationAddress: "123 Main St",
    });
    expect(prompt).toContain("Location: 123 Main St.");
  });

  it("excludes location line when address is null", () => {
    const prompt = buildImagePrompt(baseSeed);
    expect(prompt).not.toContain("Location:");
  });

  it("includes resources line when waterHave is non-empty", () => {
    const prompt = buildImagePrompt({
      ...baseSeed,
      waterHave: ["Tools", "Land"],
    });
    expect(prompt).toContain("Resources available: Tools, Land.");
  });

  it("excludes resources line when waterHave is empty", () => {
    const prompt = buildImagePrompt(baseSeed);
    expect(prompt).not.toContain("Resources available:");
  });
});
