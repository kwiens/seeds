import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TeamRoster } from "@/components/seeds/team-roster";
import { addTeamMember, removeTeamMember } from "@/lib/actions/team-roster";
import type { RosterMember } from "@/lib/db/queries/team-roster";

vi.mock("@/lib/actions/team-roster", () => ({
  addTeamMember: vi.fn().mockResolvedValue({}),
  removeTeamMember: vi.fn().mockResolvedValue({}),
}));

// Radix Select needs these DOM APIs, which jsdom does not implement.
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

const gardener: RosterMember = {
  userId: "user-gardener",
  name: "Grace Gardener",
  image: null,
  roleLabels: ["Gardener"],
  addedByName: null,
  joinedAt: new Date(2026, 0, 1),
};

const teamMember: RosterMember = {
  userId: "user-member",
  name: "Milo Member",
  image: "https://example.com/milo.jpg",
  roleLabels: ["Team member"],
  addedByName: "Grace Gardener",
  joinedAt: new Date(2026, 1, 1),
};

const steward: RosterMember = {
  userId: "user-steward",
  name: "Sana Steward",
  image: null,
  roleLabels: ["City/County Steward"],
  addedByName: "Ada Admin",
  joinedAt: new Date(2026, 2, 1),
};

const allMembers = [gardener, teamMember, steward];

function renderRoster({
  members = allMembers,
  canManage = false,
  isAdmin = false,
} = {}) {
  return render(
    <TeamRoster
      seedId="seed-1"
      members={members}
      canManage={canManage}
      isAdmin={isAdmin}
    />,
  );
}

function openAddForm() {
  fireEvent.click(screen.getByRole("button", { name: /add to team/i }));
}

function openRoleSelect() {
  fireEvent.pointerDown(screen.getByRole("combobox", { name: "Team role" }), {
    button: 0,
    ctrlKey: false,
    pointerId: 1,
    pointerType: "mouse",
  });
}

describe("TeamRoster", () => {
  beforeEach(() => {
    vi.mocked(addTeamMember).mockClear();
    vi.mocked(removeTeamMember).mockClear();
  });

  it("renders each member with name, roles, and who added them", () => {
    renderRoster();

    expect(screen.getByText("Team (3)")).toBeInTheDocument();
    expect(screen.getByText("Grace Gardener")).toBeInTheDocument();
    expect(screen.getByText("Milo Member")).toBeInTheDocument();
    expect(
      screen.getByText("Team member · added by Grace Gardener"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("City/County Steward · added by Ada Admin"),
    ).toBeInTheDocument();
  });

  it("toggles the role explainer", () => {
    renderRoster();
    const toggle = screen.getByRole("button", {
      name: "What do these roles mean?",
    });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Team Roles")).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Team Roles")).toBeInTheDocument();
    expect(
      screen.getByText("Leads the Sprout and manages its public page."),
    ).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByText("Team Roles")).not.toBeInTheDocument();
  });

  it("hides management controls when canManage is false", () => {
    renderRoster({ canManage: false });

    expect(
      screen.queryByRole("button", { name: /add to team/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /remove .* from team/i }),
    ).not.toBeInTheDocument();
  });

  it("lets a manager remove regular members but not the Gardener", () => {
    renderRoster({ canManage: true });

    expect(
      screen.getByRole("button", { name: "Remove Milo Member from team" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove Grace Gardener from team" }),
    ).not.toBeInTheDocument();
  });

  it("only lets admins remove a Steward", () => {
    const { unmount } = renderRoster({ canManage: true, isAdmin: false });
    expect(
      screen.queryByRole("button", { name: "Remove Sana Steward from team" }),
    ).not.toBeInTheDocument();
    unmount();

    renderRoster({ canManage: true, isAdmin: true });
    expect(
      screen.getByRole("button", { name: "Remove Sana Steward from team" }),
    ).toBeInTheDocument();
  });

  it("removes a member via the server action", async () => {
    renderRoster({ canManage: true });

    fireEvent.click(
      screen.getByRole("button", { name: "Remove Milo Member from team" }),
    );

    await waitFor(() =>
      expect(removeTeamMember).toHaveBeenCalledExactlyOnceWith(
        "seed-1",
        "user-member",
      ),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error when removal fails", async () => {
    vi.mocked(removeTeamMember).mockResolvedValueOnce({
      error: "Only Admins can remove a Gardener.",
    });
    renderRoster({ canManage: true });

    fireEvent.click(
      screen.getByRole("button", { name: "Remove Milo Member from team" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Only Admins can remove a Gardener.",
    );
  });

  it("adds a member with the default role and closes the form", async () => {
    renderRoster({ canManage: true });

    openAddForm();
    // Closed Radix Select renders the selected label — default is first role.
    expect(
      screen.getByRole("combobox", { name: "Team role" }),
    ).toHaveTextContent("Team member");

    const emailInput = screen.getByRole("textbox", {
      name: "Email address of person to add",
    });
    const submit = screen.getByRole("button", { name: "Add" });
    expect(submit).toBeDisabled();

    fireEvent.change(emailInput, { target: { value: "new@example.com" } });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);

    await waitFor(() =>
      expect(addTeamMember).toHaveBeenCalledExactlyOnceWith(
        "seed-1",
        "new@example.com",
        "member",
      ),
    );
    // Success closes the form and restores the add button.
    expect(
      await screen.findByRole("button", { name: /add to team/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", {
        name: "Email address of person to add",
      }),
    ).not.toBeInTheDocument();
  });

  it("submits a role chosen from the select", async () => {
    renderRoster({ canManage: true, isAdmin: true });

    openAddForm();
    openRoleSelect();
    fireEvent.click(screen.getByRole("option", { name: "Guide" }));

    fireEvent.change(
      screen.getByRole("textbox", { name: "Email address of person to add" }),
      { target: { value: "guide@example.com" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() =>
      expect(addTeamMember).toHaveBeenCalledExactlyOnceWith(
        "seed-1",
        "guide@example.com",
        "guide",
      ),
    );
  });

  it("offers the Steward role only to admins", () => {
    const { unmount } = renderRoster({ canManage: true, isAdmin: false });
    openAddForm();
    openRoleSelect();
    expect(screen.getByRole("option", { name: "Guide" })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "City/County Steward" }),
    ).not.toBeInTheDocument();
    unmount();

    renderRoster({ canManage: true, isAdmin: true });
    openAddForm();
    openRoleSelect();
    expect(
      screen.getByRole("option", { name: "City/County Steward" }),
    ).toBeInTheDocument();
  });

  it("keeps the form open and shows the error when adding fails", async () => {
    vi.mocked(addTeamMember).mockResolvedValueOnce({
      error:
        "No account found with that email — they need to sign in once first.",
    });
    renderRoster({ canManage: true });

    openAddForm();
    fireEvent.change(
      screen.getByRole("textbox", { name: "Email address of person to add" }),
      { target: { value: "missing@example.com" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No account found with that email",
    );
    expect(
      screen.getByRole("textbox", { name: "Email address of person to add" }),
    ).toBeInTheDocument();
  });

  it("cancel closes the add form without calling the action", () => {
    renderRoster({ canManage: true });

    openAddForm();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("textbox", {
        name: "Email address of person to add",
      }),
    ).not.toBeInTheDocument();
    expect(addTeamMember).not.toHaveBeenCalled();
  });
});
