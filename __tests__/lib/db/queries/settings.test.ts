import { beforeEach, describe, expect, it, vi } from "vitest";

const limit = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({ where: vi.fn(() => ({ limit })) })),
    })),
  },
}));

import { getHarvestFestPage } from "@/lib/db/queries/settings";

const event = {
  date: "October 3",
  time: "12–2 PM",
  title: "Eco Tours",
  location: "",
  description: "Come see the goats.",
};

describe("getHarvestFestPage", () => {
  beforeEach(() => {
    limit.mockReset();
  });

  it("returns an empty page when unset", async () => {
    limit.mockResolvedValue([]);
    await expect(getHarvestFestPage()).resolves.toEqual({
      title: "",
      tagline: "",
      intro: "",
      events: [],
    });
  });

  it("returns an empty page when the stored JSON is malformed", async () => {
    limit.mockResolvedValue([{ value: "{not json" }]);
    await expect(getHarvestFestPage()).resolves.toMatchObject({ events: [] });
  });

  it("drops events that no longer match the schema", async () => {
    const broken = { ...event, description: undefined };
    limit.mockResolvedValue([
      {
        value: JSON.stringify({
          title: "Fest",
          tagline: "See what grew.",
          intro: "",
          events: [event, broken, "nope"],
        }),
      },
    ]);
    await expect(getHarvestFestPage()).resolves.toEqual({
      title: "Fest",
      tagline: "See what grew.",
      intro: "",
      events: [event],
    });
  });
});
