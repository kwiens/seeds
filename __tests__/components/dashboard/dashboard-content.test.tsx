import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

const mockUserSeeds = [
  {
    id: "seed-1",
    name: "Community Garden",
    category: "daily_access" as const,
    status: "approved",
    supportCount: 5,
    createdAt: new Date("2024-06-01"),
  },
  {
    id: "seed-2",
    name: "Trail Cleanup",
    category: "outdoor_play" as const,
    status: "pending",
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
    supportCount: 12,
  },
  {
    id: "seed-4",
    name: "Bike Lane Project",
    summary: "Adding bike lanes downtown.",
    category: "connected_communities" as const,
    imageUrl: null,
    supportCount: 8,
  },
];

describe("DashboardContent", () => {
  it("shows Supporting tab by default", () => {
    render(
      <DashboardContent
        userSeeds={mockUserSeeds}
        supportedSeeds={mockSupportedSeeds}
      />,
    );

    expect(screen.getByText("River Restoration")).toBeInTheDocument();
    expect(screen.getByText("Bike Lane Project")).toBeInTheDocument();
    expect(screen.queryByText("Community Garden")).not.toBeInTheDocument();
  });

  it("switches to My Seeds tab on click", async () => {
    render(
      <DashboardContent
        userSeeds={mockUserSeeds}
        supportedSeeds={mockSupportedSeeds}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /my seeds/i }));

    expect(screen.getByText("Community Garden")).toBeInTheDocument();
    expect(screen.getByText("Trail Cleanup")).toBeInTheDocument();
    expect(screen.queryByText("River Restoration")).not.toBeInTheDocument();
  });

  it("switches back to Supporting tab", async () => {
    render(
      <DashboardContent
        userSeeds={mockUserSeeds}
        supportedSeeds={mockSupportedSeeds}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /my seeds/i }));
    fireEvent.click(screen.getByRole("button", { name: /supporting/i }));

    expect(screen.getByText("River Restoration")).toBeInTheDocument();
    expect(screen.queryByText("Community Garden")).not.toBeInTheDocument();
  });

  it("shows empty state when no supported seeds", () => {
    render(<DashboardContent userSeeds={mockUserSeeds} supportedSeeds={[]} />);

    expect(
      screen.getByText("You haven't supported any seeds yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /explore seeds/i }),
    ).toHaveAttribute("href", "/");
  });

  it("shows empty state when no user seeds", async () => {
    render(
      <DashboardContent userSeeds={[]} supportedSeeds={mockSupportedSeeds} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /my seeds/i }));

    expect(
      screen.getByText("You haven't planted any seeds yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /plant your first seed/i }),
    ).toHaveAttribute("href", "/seeds/new");
  });

  it("renders both tab buttons", () => {
    render(
      <DashboardContent
        userSeeds={mockUserSeeds}
        supportedSeeds={mockSupportedSeeds}
      />,
    );

    expect(
      screen.getByRole("button", { name: /supporting/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /my seeds/i }),
    ).toBeInTheDocument();
  });
});
