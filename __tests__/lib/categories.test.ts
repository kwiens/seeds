import { describe, expect, it } from "vitest";
import { categories, categoryKeys } from "@/lib/categories";

describe("categories", () => {
  it("has 5 categories", () => {
    expect(categoryKeys).toHaveLength(5);
  });

  it("each category has required fields", () => {
    for (const key of categoryKeys) {
      const info = categories[key];
      expect(info.label).toBeTruthy();
      expect(info.icon).toBeTruthy();
      expect(info.bgClass).toBeTruthy();
      expect(info.textClass).toBeTruthy();
      expect(info.gradient).toBeTruthy();
    }
  });

  it("category keys match expected values", () => {
    expect(categoryKeys).toEqual([
      "daily_access",
      "outdoor_play",
      "balanced_growth",
      "respect",
      "connected_communities",
    ]);
  });
});
