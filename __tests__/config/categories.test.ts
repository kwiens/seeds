import { describe, expect, expectTypeOf, it } from "vitest";
import {
  categories,
  categoryKeys,
  isCategoryKey,
  type CategoryInfo,
} from "@/config/categories";

describe("categories", () => {
  it("defines a nonempty catalog with unique, valid keys", () => {
    expect(categoryKeys.length).toBeGreaterThan(0);
    expect(categoryKeys).toEqual(Object.keys(categories));
    expect(new Set(categoryKeys).size).toBe(categoryKeys.length);
    for (const key of categoryKeys) {
      expect(key).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it("permits categories without optional About copy", () => {
    expectTypeOf(categories[categoryKeys[0]]).toEqualTypeOf<CategoryInfo>();
  });

  it("each category has required fields", () => {
    for (const key of categoryKeys) {
      const info = categories[key];
      expect(info.label).toBeTruthy();
      expect(info.icon).toBeTruthy();
      expect(info.color).toBeTruthy();
      expect(info.bgClass).toBeTruthy();
      expect(info.textClass).toBeTruthy();
      expect(info.gradient).toBeTruthy();
    }
  });

  it("recognizes only configured category keys", () => {
    for (const key of categoryKeys) expect(isCategoryKey(key)).toBe(true);
    for (const value of [
      null,
      undefined,
      1,
      "",
      "toString",
      "constructor",
      "__proto__",
    ]) {
      expect(isCategoryKey(value)).toBe(false);
    }
  });
});
