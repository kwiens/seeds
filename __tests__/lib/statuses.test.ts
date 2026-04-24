import { describe, expect, it } from "vitest";
import {
  publicStatusOrder,
  seedStatuses,
  slugToStatusKey,
  statusKeyToSlug,
  statuses,
} from "@/lib/statuses";

describe("slugToStatusKey", () => {
  it("maps 'seeds' to approved (the Seeds bucket)", () => {
    expect(slugToStatusKey("seeds")).toBe("approved");
  });

  it("maps 'sprouts' to in_progress", () => {
    expect(slugToStatusKey("sprouts")).toBe("in_progress");
  });

  it("maps 'trees' to in_maintenance", () => {
    expect(slugToStatusKey("trees")).toBe("in_maintenance");
  });

  it("returns undefined for unknown slugs", () => {
    expect(slugToStatusKey("unknown")).toBeUndefined();
    expect(slugToStatusKey("")).toBeUndefined();
  });
});

describe("statusKeyToSlug", () => {
  it("maps each status to its slug", () => {
    expect(statusKeyToSlug("pending")).toBe("seeds");
    expect(statusKeyToSlug("approved")).toBe("seeds");
    expect(statusKeyToSlug("in_progress")).toBe("sprouts");
    expect(statusKeyToSlug("in_maintenance")).toBe("trees");
  });
});

describe("publicStatusOrder", () => {
  it("omits 'pending' (merged into the Seeds bucket with approved)", () => {
    expect(publicStatusOrder).not.toContain("pending");
  });

  it("lists stages from least to most mature", () => {
    expect(publicStatusOrder).toEqual([
      "approved",
      "in_progress",
      "in_maintenance",
    ]);
  });
});

describe("seedStatuses", () => {
  it("merges pending and approved under the Seeds bucket", () => {
    expect(seedStatuses).toEqual(["pending", "approved"]);
  });
});

describe("statuses config", () => {
  it("pending and approved share the same slug so they route together", () => {
    expect(statuses.pending.slug).toBe(statuses.approved.slug);
  });

  it("uses distinct badge variants for pending vs approved to reflect promotion", () => {
    expect(statuses.pending.badgeVariant).not.toBe(
      statuses.approved.badgeVariant,
    );
  });
});
