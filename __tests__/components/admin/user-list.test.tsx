import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserList } from "@/components/admin/user-list";

const { pushMock, useSearchParamsMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  useSearchParamsMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: useSearchParamsMock,
}));

const users = [
  {
    id: "admin-1",
    name: "Alice Admin",
    email: "alice@example.com",
    role: "admin",
    createdAt: new Date("2026-08-18T01:00:00Z"),
  },
  {
    id: "council-1",
    name: "Bob Council",
    email: "bob@example.com",
    role: "council",
    createdAt: new Date("2026-08-19T12:00:00Z"),
  },
  {
    id: "user-1",
    name: "Casey Member",
    email: "casey@example.com",
    role: "user",
    createdAt: new Date("2026-08-20T12:00:00Z"),
  },
];

function searchFor(value: string) {
  fireEvent.change(
    screen.getByRole("textbox", {
      name: "Search people by name or email",
    }),
    { target: { value } },
  );
}

describe("UserList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSearchParamsMock.mockReturnValue(new URLSearchParams("tab=users"));
  });

  it("renders the current page, full count, roles, and Chattanooga join date", () => {
    render(
      <UserList
        users={users}
        totalCount={43}
        totalPages={3}
        currentPage={1}
        pageSize={20}
      />,
    );

    expect(
      screen.getByRole("textbox", {
        name: "Search people by name or email",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Showing 1–3 of 43")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByText("Alice Admin")).toBeInTheDocument();
    expect(within(rows[0]).getByText("alice@example.com")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Admin")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Aug 17, 2026")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Council")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Member")).toBeInTheDocument();
  });

  it("moves to the next server-rendered page and preserves the People tab", () => {
    render(
      <UserList
        users={users}
        totalCount={43}
        totalPages={3}
        currentPage={1}
        pageSize={20}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(pushMock).toHaveBeenCalledWith("?tab=users&page=2");
  });

  it("sends a debounced search to the server and resets the page", () => {
    vi.useFakeTimers();
    useSearchParamsMock.mockReturnValue(
      new URLSearchParams("tab=users&page=3"),
    );
    render(
      <UserList
        users={users}
        totalCount={43}
        totalPages={3}
        currentPage={3}
        pageSize={20}
      />,
    );

    searchFor("CASEY@EXAMPLE");
    act(() => vi.advanceTimersByTime(300));

    expect(pushMock).toHaveBeenCalledWith("?tab=users&search=CASEY%40EXAMPLE");
    vi.useRealTimers();
  });

  it("shows distinct empty states for the directory and search results", () => {
    const { rerender } = render(
      <UserList
        users={[]}
        totalCount={0}
        totalPages={0}
        currentPage={1}
        pageSize={20}
      />,
    );

    expect(screen.getByText("No accounts yet.")).toBeInTheDocument();
    expect(screen.getByText("0 people")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    rerender(
      <UserList
        users={[]}
        totalCount={0}
        totalPages={0}
        currentPage={1}
        pageSize={20}
        search="nobody@example.com"
      />,
    );
    expect(
      screen.getByText("No people match your search."),
    ).toBeInTheDocument();
  });
});
