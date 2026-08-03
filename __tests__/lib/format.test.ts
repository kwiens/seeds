import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatDisplayName, formatRelativeTime } from "@/lib/format";

describe("formatDisplayName", () => {
  it("returns a single name unchanged", () => {
    expect(formatDisplayName("Madonna")).toBe("Madonna");
  });

  it("formats first name and last initial for two-part names", () => {
    expect(formatDisplayName("John Doe")).toBe("John D.");
  });

  it("uses the first and last parts for names with a middle name", () => {
    expect(formatDisplayName("John Middle Doe")).toBe("John D.");
  });

  it("collapses internal and surrounding whitespace", () => {
    expect(formatDisplayName("  John   Doe  ")).toBe("John D.");
  });

  it("returns an empty string for empty input", () => {
    expect(formatDisplayName("")).toBe("");
  });

  it("returns an empty string for whitespace-only input", () => {
    expect(formatDisplayName("   ")).toBe("");
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2024-06-15T12:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("treats future dates as just now", () => {
    expect(formatRelativeTime(new Date(now.getTime() + 5000))).toBe("just now");
  });

  it("treats sub-minute durations as just now", () => {
    expect(formatRelativeTime(new Date(now.getTime() - 59_000))).toBe(
      "just now",
    );
  });

  it("shows minutes once a full minute has elapsed", () => {
    expect(formatRelativeTime(new Date(now.getTime() - 60_000))).toBe("1m ago");
    expect(formatRelativeTime(new Date(now.getTime() - 5 * 60_000))).toBe(
      "5m ago",
    );
  });

  it("shows hours once a full hour has elapsed", () => {
    expect(formatRelativeTime(new Date(now.getTime() - 60 * 60_000))).toBe(
      "1h ago",
    );
    expect(formatRelativeTime(new Date(now.getTime() - 3 * 60 * 60_000))).toBe(
      "3h ago",
    );
  });

  it("shows days once a full day has elapsed", () => {
    expect(formatRelativeTime(new Date(now.getTime() - 24 * 60 * 60_000))).toBe(
      "1d ago",
    );
    expect(
      formatRelativeTime(new Date(now.getTime() - 5 * 24 * 60 * 60_000)),
    ).toBe("5d ago");
  });

  it("falls back to a short date once 30 days have elapsed", () => {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60_000);
    expect(formatRelativeTime(thirtyDaysAgo)).toBe(
      thirtyDaysAgo.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    );
  });

  it("formats dates far in the past", () => {
    const longAgo = new Date("2023-01-01T00:00:00.000Z");
    expect(formatRelativeTime(longAgo)).toBe(
      longAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    );
  });
});
