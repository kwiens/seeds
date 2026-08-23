import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AcceptInviteButton } from "@/components/auth/accept-invite-button";
import { acceptInvite } from "@/lib/actions/invites";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/actions/invites", () => ({ acceptInvite: vi.fn() }));

describe("AcceptInviteButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(acceptInvite).mockResolvedValue({
      success: true,
      projectId: "00000000-0000-4000-8000-000000000001",
    });
  });

  it("accepts the invite and opens the team workspace", async () => {
    render(<AcceptInviteButton token="invite-token" roleLabel="Guide" />);

    fireEvent.click(
      screen.getByRole("button", { name: "Accept — join as Guide" }),
    );

    await waitFor(() =>
      expect(acceptInvite).toHaveBeenCalledExactlyOnceWith("invite-token"),
    );
    expect(router.push).toHaveBeenCalledExactlyOnceWith(
      "/dashboard/projects/00000000-0000-4000-8000-000000000001/team",
    );
    expect(router.refresh).toHaveBeenCalledOnce();
  });

  it("shows an action error without navigating", async () => {
    vi.mocked(acceptInvite).mockResolvedValueOnce({
      error: "This invite has already been used.",
    });
    render(<AcceptInviteButton token="invite-token" roleLabel="Guide" />);

    fireEvent.click(
      screen.getByRole("button", { name: "Accept — join as Guide" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This invite has already been used.",
    );
    expect(router.push).not.toHaveBeenCalled();
  });

  it("shows a recoverable error when the request rejects", async () => {
    vi.mocked(acceptInvite).mockRejectedValueOnce(new Error("offline"));
    render(<AcceptInviteButton token="invite-token" roleLabel="Guide" />);

    fireEvent.click(
      screen.getByRole("button", { name: "Accept — join as Guide" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not join the team. Check your connection and try again.",
    );
    expect(router.push).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Accept — join as Guide" }),
    ).toBeEnabled();
  });
});
