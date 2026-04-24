import { describe, expect, it } from "vitest";
import { seedStatuses } from "@/lib/statuses";
import { statusFilter } from "@/lib/db/queries/seeds";

describe("statusFilter", () => {
  it("returns a truthy SQL expression for every status", () => {
    expect(statusFilter("pending")).toBeTruthy();
    expect(statusFilter("approved")).toBeTruthy();
    expect(statusFilter("in_progress")).toBeTruthy();
    expect(statusFilter("in_maintenance")).toBeTruthy();
  });

  // Guard: the merge relies on seedStatuses containing both "pending" and
  // "approved" (the Seeds bucket). If someone narrows seedStatuses,
  // /status/seeds will silently start omitting half its rows.
  it("keeps pending+approved in the merged Seeds bucket", () => {
    expect(seedStatuses).toContain("pending");
    expect(seedStatuses).toContain("approved");
  });
});
