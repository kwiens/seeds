import { describe, expect, it } from "vitest";
import { categories, categoryKeys } from "@/config/categories";
import { siteConfig } from "@/config/site";

// Guards against a city config that would break the app at runtime.
describe("site config", () => {
  it("has a canonical https origin with no trailing slash", () => {
    expect(siteConfig.origin).toMatch(/^https:\/\/[^/]+$/);
  });

  it("has a valid map center", () => {
    const { latitude, longitude } = siteConfig.map.center;
    expect(latitude).toBeGreaterThanOrEqual(-90);
    expect(latitude).toBeLessThanOrEqual(90);
    expect(longitude).toBeGreaterThanOrEqual(-180);
    expect(longitude).toBeLessThanOrEqual(180);
  });

  it("uses a lowercase two-letter country code for address search", () => {
    expect(siteConfig.city.country).toMatch(/^[a-z]{2}$/);
  });

  it("resolves its timezone and locale", () => {
    expect(() =>
      new Intl.DateTimeFormat(siteConfig.locale, {
        timeZone: siteConfig.timeZone,
      }).format(new Date()),
    ).not.toThrow();
  });

  it("defines at least one category with a label and icon", () => {
    expect(categoryKeys.length).toBeGreaterThan(0);
    for (const key of categoryKeys) {
      expect(key).toMatch(/^[a-z][a-z0-9_]*$/);
      expect(categories[key].label).toBeTruthy();
      expect(categories[key].icon).toBeTruthy();
    }
  });
});
