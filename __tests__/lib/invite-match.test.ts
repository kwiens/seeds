import { describe, expect, it } from "vitest";
import { namesLikelyMatch } from "@/lib/invite-match";

describe("namesLikelyMatch", () => {
  it("matches an identical name", () => {
    expect(namesLikelyMatch("Priya Patel", "Priya Patel")).toBe(true);
  });

  it("matches when only one name part overlaps", () => {
    expect(namesLikelyMatch("Priya Patel", "Priya P.")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(namesLikelyMatch("priya patel", "PRIYA PATEL")).toBe(true);
  });

  it("ignores punctuation", () => {
    expect(namesLikelyMatch("O'Brien", "Kevin O'Brien")).toBe(true);
  });

  it("does not match unrelated names", () => {
    expect(namesLikelyMatch("Priya Patel", "Bob Smith")).toBe(false);
  });

  it("does not match on single-letter overlap", () => {
    expect(namesLikelyMatch("A B", "A C")).toBe(false);
  });
});
