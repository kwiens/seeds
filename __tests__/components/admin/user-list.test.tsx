import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserList } from "@/components/admin/user-list";

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
  it("renders the account fields, count, roles, and Chattanooga join date", () => {
    render(<UserList users={users} />);

    expect(
      screen.getByRole("textbox", {
        name: "Search people by name or email",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("3 of 3")).toBeInTheDocument();

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByText("Alice Admin")).toBeInTheDocument();
    expect(within(rows[0]).getByText("alice@example.com")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Admin")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Aug 17, 2026")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Council")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Member")).toBeInTheDocument();
  });

  it("searches names and emails case-insensitively after trimming", () => {
    render(<UserList users={users} />);

    searchFor("  bOB  ");
    expect(screen.getByText("Bob Council")).toBeInTheDocument();
    expect(screen.queryByText("Alice Admin")).not.toBeInTheDocument();
    expect(screen.getByText("1 of 3")).toBeInTheDocument();

    searchFor("CASEY@EXAMPLE");
    expect(screen.getByText("Casey Member")).toBeInTheDocument();
    expect(screen.queryByText("Bob Council")).not.toBeInTheDocument();
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
  });

  it("shows no-match feedback and restores all rows when search clears", () => {
    render(<UserList users={users} />);

    searchFor("nobody@example.com");
    expect(screen.getByText("No matches.")).toBeInTheDocument();
    expect(screen.getByText("0 of 3")).toBeInTheDocument();

    searchFor("");
    expect(screen.queryByText("No matches.")).not.toBeInTheDocument();
    expect(screen.getByText("3 of 3")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(4);
  });

  it("shows the account empty state", () => {
    render(<UserList users={[]} />);

    expect(screen.getByText("No accounts yet.")).toBeInTheDocument();
    expect(screen.getByText("0 of 0")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
