import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockAdminSession,
  mockSession,
  setAuthMock,
} from "@/__tests__/test-utils";

const { routerPushMock, useSearchParamsMock } = vi.hoisted(() => ({
  routerPushMock: vi.fn(),
  useSearchParamsMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  useRouter: () => ({ push: routerPushMock }),
  useSearchParams: useSearchParamsMock,
}));

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/db/queries/admin", () => ({
  getAdminEmails: vi.fn(),
  getAllProjects: vi.fn(),
  getCouncilMembers: vi.fn(),
  getSupporterEmailsMap: vi.fn(),
  getUsersPage: vi.fn(),
  USERS_PER_PAGE: 20,
}));

vi.mock("@/lib/db/queries/comments", () => ({ getAllComments: vi.fn() }));
vi.mock("@/lib/db/queries/settings", () => ({
  getBannerConfig: vi.fn(),
  getHomepagePhase: vi.fn(),
}));

vi.mock("@/components/admin/admin-comments-table", () => ({
  AdminCommentsTable: () => <div>Comments table</div>,
}));
vi.mock("@/components/admin/admin-email-list", () => ({
  AdminEmailList: () => <div>Admin email list</div>,
}));
vi.mock("@/components/admin/banner-settings", () => ({
  BannerSettings: () => <div>Banner settings</div>,
}));
vi.mock("@/components/admin/council-list", () => ({
  CouncilList: () => <div>Council list</div>,
}));
vi.mock("@/components/admin/export-buttons", () => ({
  ExportButtons: () => <div>Export buttons</div>,
}));
vi.mock("@/components/admin/homepage-phase-toggle", () => ({
  HomepagePhaseToggle: () => <div>Homepage phase</div>,
}));
vi.mock("@/components/admin/seed-data-table", () => ({
  AdminSeedTable: () => <div>Seed table</div>,
}));
vi.mock("@/components/admin/user-list", () => ({
  UserList: ({
    currentPage,
    totalCount,
    users,
  }: {
    currentPage: number;
    totalCount: number;
    users: Array<{ name: string }>;
  }) => (
    <div data-testid="user-list">
      Page {currentPage}; {totalCount} total;{" "}
      {users.map((user) => user.name).join(", ")}
    </div>
  ),
}));

import { auth } from "@/auth";
import AdminPage from "@/app/admin/page";
import {
  getAdminEmails,
  getAllProjects,
  getCouncilMembers,
  getSupporterEmailsMap,
  getUsersPage,
} from "@/lib/db/queries/admin";
import { getAllComments } from "@/lib/db/queries/comments";
import { getBannerConfig, getHomepagePhase } from "@/lib/db/queries/settings";

const directoryUsers = [
  {
    id: "user-1",
    name: "Alice Account",
    email: "alice@example.com",
    role: "user" as const,
    createdAt: new Date("2026-08-20T12:00:00Z"),
  },
];

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSearchParamsMock.mockReturnValue(new URLSearchParams());
    vi.mocked(getAllProjects).mockResolvedValue([]);
    vi.mocked(getSupporterEmailsMap).mockResolvedValue(new Map());
    vi.mocked(getAdminEmails).mockResolvedValue([]);
    vi.mocked(getCouncilMembers).mockResolvedValue([]);
    vi.mocked(getUsersPage).mockResolvedValue({
      users: directoryUsers,
      totalCount: 21,
      totalPages: 2,
      currentPage: 2,
      pageSize: 20,
    });
    vi.mocked(getAllComments).mockResolvedValue([]);
    vi.mocked(getHomepagePhase).mockResolvedValue(1);
    vi.mocked(getBannerConfig).mockResolvedValue({
      enabled: false,
      message: "",
      href: "",
    });
  });

  it.each([
    ["anonymous", null],
    ["regular user", mockSession({ role: "user" })],
    ["council member", mockSession({ role: "council" })],
  ])("redirects a %s before loading directory data", async (_label, session) => {
    setAuthMock(auth, session);

    await expect(
      AdminPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_REDIRECT:/");

    expect(getUsersPage).not.toHaveBeenCalled();
    expect(getAllProjects).not.toHaveBeenCalled();
  });

  it("loads only the default Seeds tab data and makes People URL-addressable", async () => {
    setAuthMock(auth, mockAdminSession());

    render(await AdminPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("tab", { name: "People" })).toBeInTheDocument();
    expect(getAllProjects).toHaveBeenCalledOnce();
    expect(getUsersPage).not.toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByRole("tab", { name: "People" }), {
      button: 0,
      ctrlKey: false,
    });

    expect(routerPushMock).toHaveBeenCalledWith("/admin?tab=users", {
      scroll: false,
    });
  });

  it("loads one searched People page without loading other large tabs", async () => {
    setAuthMock(auth, mockAdminSession());
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams("tab=users&page=2&search=Alice"),
    );

    render(
      await AdminPage({
        searchParams: Promise.resolve({
          tab: "users",
          page: "2",
          search: "  Alice  ",
        }),
      }),
    );

    expect(getUsersPage).toHaveBeenCalledWith({ page: 2, search: "Alice" });
    expect(getAllProjects).not.toHaveBeenCalled();
    expect(getSupporterEmailsMap).not.toHaveBeenCalled();
    expect(getAllComments).not.toHaveBeenCalled();

    expect(
      screen.getByRole("heading", { name: "All People" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("user-list")).toHaveTextContent(
      "Page 2; 21 total; Alice Account",
    );
    expect(
      screen.queryByText(/Check whether someone already has an account/),
    ).not.toBeInTheDocument();
  });

  it("redirects an out-of-range People page to the last result page", async () => {
    setAuthMock(auth, mockAdminSession());
    vi.mocked(getUsersPage).mockResolvedValue({
      users: [],
      totalCount: 45,
      totalPages: 3,
      currentPage: 99,
      pageSize: 20,
    });

    await expect(
      AdminPage({
        searchParams: Promise.resolve({ tab: "users", page: "99" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/admin?tab=users&page=3");
  });
});
