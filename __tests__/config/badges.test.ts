import { describe, expect, it } from "vitest";
import { badgeKeys, badges } from "@/config/badges";

describe("badges", () => {
  it("exposes badge keys matching the badges record", () => {
    expect(badgeKeys).toEqual(Object.keys(badges));
  });

  it("uses unique, valid keys", () => {
    expect(new Set(badgeKeys).size).toBe(badgeKeys.length);
    for (const key of badgeKeys) expect(key).toMatch(/^[a-z][a-z0-9_]*$/);
  });

  it("gives every badge a label, color, and Tailwind classes", () => {
    for (const key of badgeKeys) {
      const badge = badges[key];
      expect(badge.icon).toBeTruthy();
      expect(badge.label.length).toBeGreaterThan(0);
      expect(badge.color.length).toBeGreaterThan(0);
      expect(badge.bgClass).toContain("bg-");
      expect(badge.textClass).toContain("text-");
    }
  });
});
