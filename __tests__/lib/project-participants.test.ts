import { describe, expect, it } from "vitest";
import { formParticipantInputs } from "@/lib/project-participants";

const values = {
  gardeners: [" Alice ", "alice", "Bob"],
  roots: [
    { name: "Neighborhood Org", committed: true },
    { name: "Future Funder", committed: false },
  ],
  supportPeople: ["Guide One"],
};

describe("formParticipantInputs", () => {
  it("consolidates form people into role-bearing participants", () => {
    expect(formParticipantInputs(values)).toEqual([
      { displayName: "Alice", role: "gardener", state: "active" },
      { displayName: "Bob", role: "gardener", state: "active" },
      { displayName: "Neighborhood Org", role: "roots", state: "active" },
      { displayName: "Future Funder", role: "roots", state: "prospective" },
      { displayName: "Guide One", role: "guide", state: "prospective" },
    ]);
  });

  it("deduplicates names case-insensitively within a role", () => {
    const result = formParticipantInputs(values);
    expect(result.filter((item) => item.role === "gardener")).toHaveLength(2);
  });

  it("excludes registered participants already represented by an account", () => {
    const result = formParticipantInputs(values, {
      gardener: ["ALICE"],
      guide: ["Guide One"],
    });
    expect(result.map((item) => item.displayName)).not.toContain("Alice");
    expect(result.map((item) => item.displayName)).not.toContain("Guide One");
  });

  it("only de-duplicates account-backed people within the same role", () => {
    const result = formParticipantInputs(
      {
        gardeners: ["Alex"],
        roots: [{ name: "Alex", committed: true }],
        supportPeople: ["Alex"],
      },
      { gardener: ["Alex"] },
    );
    expect(result.map((item) => item.role)).toEqual(["roots", "guide"]);
  });

  it("allows the same person to hold different roles", () => {
    const result = formParticipantInputs({
      gardeners: ["Alex"],
      roots: [{ name: "Alex", committed: true }],
      supportPeople: ["Alex"],
    });
    expect(result.map((item) => item.role)).toEqual([
      "gardener",
      "roots",
      "guide",
    ]);
  });

  it("drops blank names", () => {
    const result = formParticipantInputs({
      gardeners: ["", "  "],
      roots: [{ name: " ", committed: false }],
      supportPeople: [""],
    });
    expect(result).toEqual([]);
  });
});
