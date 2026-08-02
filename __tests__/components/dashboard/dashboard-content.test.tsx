import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

const mockUserSeeds = [
  {
    id: "seed-1",
    name: "Community Garden",
    category: "daily_access" as const,
    stage: "seed" as const,
    approvalState: "approved" as const,
    archivedAt: null,
    supportCount: 5,
    createdAt: new Date("2024-06-01"),
  },
  {
    id: "seed-2",
    name: "Trail Cleanup",
    category: "outdoor_play" as const,
    stage: "seed" as const,
    approvalState: "pending" as const,
    archivedAt: null,
    supportCount: 2,
    createdAt: new Date("2024-07-01"),
  },
];

const mockSupportedSeeds = [
  {
    id: "seed-3",
    name: "River Restoration",
    summary: "Restoring the riverbanks.",
    category: "respect" as const,
    imageUrl: "https://example.com/river.jpg",
    coverPhotoUrl: null,
    stage: "sprout" as const,
    approvalState: "approved" as const,
    supportCount: 12,
  },
  {
    id: "seed-4",
    name: "Bike Lane Project",
    summary: "Adding bike lanes downtown.",
    category: "connected_communities" as const,
    imageUrl: null,
    coverPhotoUrl: null,
    stage: "seed" as const,
    approvalState: "approved" as const,
    supportCount: 8,
  },
];

const mockSprouts = [
  {
    id: "sprout-1",
    name: "Neighborhood Orchard",
    category: "balanced_growth" as const,
    lastActivityAt: new Date("2024-08-01"),
    unreadCount: 2,
    role: "Gardener",
    stage: "sprout" as const,
  },
];

function selectTab(name: RegExp) {
  fireEvent.click(screen.getByRole("tab", { name }));
}

describe("DashboardContent", () => {
  it("shows My Sprouts by default when the user has active Sprouts", () => {
    render(
      <DashboardContent
        sprouts={mockSprouts}
        userSeeds={mockUserSeeds}
        supportedSeeds={mockSupportedSeeds}
      />,
    );

    expect(screen.getByText("Neighborhood Orchard")).toBeInTheDocument();
    expect(screen.queryByText("Community Garden")).not.toBeInTheDocument();
    expect(screen.queryByText("River Restoration")).not.toBeInTheDocument();
  });

  it("defaults to My Seeds when there are active Seeds but no Sprouts", () => {
    render(
      <DashboardContent
        sprouts={[]}
        userSeeds={mockUserSeeds}
        supportedSeeds={mockSupportedSeeds}
      />,
    );

    expect(screen.getByText("Community Garden")).toBeInTheDocument();
    expect(screen.getByText("Trail Cleanup")).toBeInTheDocument();
    expect(screen.queryByText("River Restoration")).not.toBeInTheDocument();
  });

  it("defaults to Supporting when there are no Sprouts or active Seeds", () => {
    render(
      <DashboardContent
        sprouts={[]}
        userSeeds={[
          {
            ...mockUserSeeds[0],
            archivedAt: new Date("2024-08-01"),
          },
        ]}
        supportedSeeds={mockSupportedSeeds}
      />,
    );

    expect(screen.getByText("River Restoration")).toBeInTheDocument();
    expect(screen.queryByText("Community Garden")).not.toBeInTheDocument();
  });

  it("switches among all three tabs", () => {
    render(
      <DashboardContent
        sprouts={mockSprouts}
        userSeeds={mockUserSeeds}
        supportedSeeds={mockSupportedSeeds}
      />,
    );

    selectTab(/my projects/i);
    expect(screen.getByText("Community Garden")).toBeInTheDocument();

    selectTab(/supporting/i);
    expect(screen.getByText("River Restoration")).toBeInTheDocument();
  });

  it("shows empty state when no supported seeds", () => {
    render(
      <DashboardContent
        sprouts={[]}
        userSeeds={mockUserSeeds}
        supportedSeeds={[]}
        initialTab="supporting"
      />,
    );

    expect(
      screen.getByText("You haven't supported any seeds yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /explore seeds/i }),
    ).toHaveAttribute("href", "/");
  });

  it("shows empty state when no user seeds", async () => {
    render(
      <DashboardContent
        sprouts={[]}
        userSeeds={[]}
        supportedSeeds={mockSupportedSeeds}
      />,
    );

    selectTab(/my projects/i);

    expect(
      screen.getByText("You haven't planted any seeds yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /plant your first seed/i }),
    ).toHaveAttribute("href", "/seeds/new");
  });

  it("renders all three tabs", () => {
    render(
      <DashboardContent
        sprouts={mockSprouts}
        userSeeds={mockUserSeeds}
        supportedSeeds={mockSupportedSeeds}
      />,
    );

    expect(
      screen.getByRole("tab", { name: /team workspaces/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /my projects/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /supporting/i }),
    ).toBeInTheDocument();
  });
});
