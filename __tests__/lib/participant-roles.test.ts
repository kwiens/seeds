import { describe, expect, it } from "vitest";
import {
  participantRoleLabels,
  teamAccessRoles,
  teamRoleKeys,
} from "@/lib/participant-roles";

describe("participant roles", () => {
  it("keeps support and project membership in one role vocabulary", () => {
    expect(participantRoleLabels).toMatchObject({
      supporter: "Supporter",
      member: "Team member",
      gardener: "Gardener",
      co_gardener: "co-Gardener",
      guide: "Guide",
      roots: "Roots",
    });
  });

  it("allows a generic member to be assigned through the team roster", () => {
    expect(teamRoleKeys).toContain("member");
  });

  it("grants team access to active team roles but not supporter-only roles", () => {
    expect(teamAccessRoles).toContain("gardener");
    expect(teamAccessRoles).toContain("member");
    expect(teamAccessRoles).toContain("guide");
    expect(teamAccessRoles).not.toContain("supporter");
  });
});
