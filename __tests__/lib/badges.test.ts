import { describe, expect, it } from "vitest";
import { Banknote, Building2, HandHelping, HardHat } from "lucide-react";
import { badgeKeys, badges } from "@/lib/badges";

describe("badges", () => {
  it("exposes badge keys matching the badges record", () => {
    expect(badgeKeys).toEqual([
      "funded",
      "in_construction",
      "needs_volunteers",
      "city_partnership",
    ]);
    expect(badgeKeys).toEqual(Object.keys(badges));
  });

  it("maps each key to its expected icon", () => {
    expect(badges.funded.icon).toBe(Banknote);
    expect(badges.in_construction.icon).toBe(HardHat);
    expect(badges.needs_volunteers.icon).toBe(HandHelping);
    expect(badges.city_partnership.icon).toBe(Building2);
  });

  it("gives every badge a label, color, and Tailwind classes", () => {
    for (const key of badgeKeys) {
      const badge = badges[key];
      expect(badge.label.length).toBeGreaterThan(0);
      expect(badge.color.length).toBeGreaterThan(0);
      expect(badge.bgClass).toContain("bg-");
      expect(badge.textClass).toContain("text-");
    }
  });
});
