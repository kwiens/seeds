import { describe, expect, it } from "vitest";
import { teamEventFormSchema } from "@/lib/validations/team-event";

describe("teamEventFormSchema", () => {
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

  const validData = {
    title: "Community Meetup",
    startsAt: futureDate,
    location: "Central Park",
  };

  it("accepts valid event data", () => {
    const result = teamEventFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("requires title", () => {
    const result = teamEventFormSchema.safeParse({
      ...validData,
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title longer than 200 characters", () => {
    const result = teamEventFormSchema.safeParse({
      ...validData,
      title: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("accepts title at exactly 200 characters", () => {
    const result = teamEventFormSchema.safeParse({
      ...validData,
      title: "a".repeat(200),
    });
    expect(result.success).toBe(true);
  });

  describe("date coercion and future validation", () => {
    it("coerces string date to Date object", () => {
      const futureIsoDate = futureDate.toISOString();
      const result = teamEventFormSchema.safeParse({
        ...validData,
        startsAt: futureIsoDate,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startsAt).toBeInstanceOf(Date);
      }
    });

    it("coerces ISO string to Date", () => {
      const result = teamEventFormSchema.safeParse({
        ...validData,
        startsAt: futureDate.toISOString(),
      });
      expect(result.success).toBe(true);
    });

    it("coerces timestamp number to Date", () => {
      const futureTimestamp = Date.now() + 24 * 60 * 60 * 1000;
      const result = teamEventFormSchema.safeParse({
        ...validData,
        startsAt: futureTimestamp,
      });
      expect(result.success).toBe(true);
    });

    it("rejects past dates", () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = teamEventFormSchema.safeParse({
        ...validData,
        startsAt: pastDate,
      });
      expect(result.success).toBe(false);
    });

    it("rejects current date (not in future)", () => {
      const now = new Date();
      const result = teamEventFormSchema.safeParse({
        ...validData,
        startsAt: now,
      });
      expect(result.success).toBe(false);
    });

    it("accepts dates far in the future", () => {
      const farFutureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const result = teamEventFormSchema.safeParse({
        ...validData,
        startsAt: farFutureDate,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("location field", () => {
    it("accepts location as optional", () => {
      const result = teamEventFormSchema.safeParse({
        title: "Virtual Event",
        startsAt: futureDate,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.location).toBeUndefined();
      }
    });

    it("accepts location as undefined", () => {
      const result = teamEventFormSchema.safeParse({
        ...validData,
        location: undefined,
      });
      expect(result.success).toBe(true);
    });

    it("rejects location longer than 300 characters", () => {
      const result = teamEventFormSchema.safeParse({
        ...validData,
        location: "a".repeat(301),
      });
      expect(result.success).toBe(false);
    });

    it("accepts location at exactly 300 characters", () => {
      const result = teamEventFormSchema.safeParse({
        ...validData,
        location: "a".repeat(300),
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty string location", () => {
      const result = teamEventFormSchema.safeParse({
        ...validData,
        location: "",
      });
      expect(result.success).toBe(true);
    });
  });
});
