import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectWorkspaceNav } from "@/components/dashboard/project-workspace-nav";

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn<() => string>(),
}));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

function renderNav({
  pathname,
  canManage = true,
  canAccessTeam = true,
  projectId = "project-1",
}: {
  pathname: string;
  canManage?: boolean;
  canAccessTeam?: boolean;
  projectId?: string;
}) {
  usePathnameMock.mockReturnValue(pathname);
  return render(
    <ProjectWorkspaceNav
      projectId={projectId}
      canManage={canManage}
      canAccessTeam={canAccessTeam}
    />,
  );
}

function linkNames() {
  return screen.getAllByRole("link").map((link) => link.textContent);
}

describe("ProjectWorkspaceNav", () => {
  it("renders a labelled navigation landmark", () => {
    renderNav({ pathname: "/dashboard/projects/project-1/team" });

    expect(
      screen.getByRole("navigation", { name: "Project workspace" }),
    ).toBeInTheDocument();
  });

  it("renders every section with project-scoped hrefs for a manager on the team", () => {
    renderNav({
      pathname: "/dashboard/projects/project-1/team",
      projectId: "project-42",
    });

    expect(linkNames()).toEqual([
      "Team Workspace",
      "Edit Project",
      "Public Updates",
      "Supporters",
    ]);
    expect(
      screen.getByRole("link", { name: "Team Workspace" }),
    ).toHaveAttribute("href", "/dashboard/projects/project-42/team");
    expect(screen.getByRole("link", { name: "Edit Project" })).toHaveAttribute(
      "href",
      "/dashboard/projects/project-42/edit",
    );
    expect(
      screen.getByRole("link", { name: "Public Updates" }),
    ).toHaveAttribute("href", "/dashboard/projects/project-42/updates");
    expect(screen.getByRole("link", { name: "Supporters" })).toHaveAttribute(
      "href",
      "/dashboard/projects/project-42/supporters",
    );
  });

  it("shows only the team link for a non-manager with team access", () => {
    renderNav({
      pathname: "/dashboard/projects/project-1/team",
      canManage: false,
    });

    expect(linkNames()).toEqual(["Team Workspace"]);
  });

  it("shows only the manager links when there is no team access", () => {
    renderNav({
      pathname: "/dashboard/projects/project-1/edit",
      canAccessTeam: false,
    });

    expect(linkNames()).toEqual([
      "Edit Project",
      "Public Updates",
      "Supporters",
    ]);
  });

  it("renders no links when the user can neither manage nor access the team", () => {
    renderNav({
      pathname: "/dashboard/projects/project-1",
      canManage: false,
      canAccessTeam: false,
    });

    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("marks the link matching the current pathname as the active page", () => {
    renderNav({ pathname: "/dashboard/projects/project-1/supporters" });

    expect(screen.getByRole("link", { name: "Supporters" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    for (const name of ["Team Workspace", "Edit Project", "Public Updates"]) {
      expect(screen.getByRole("link", { name })).not.toHaveAttribute(
        "aria-current",
      );
    }
  });

  it("keeps Public Updates active on nested update routes", () => {
    renderNav({
      pathname: "/dashboard/projects/project-1/updates/update-9/edit",
    });

    expect(
      screen.getByRole("link", { name: "Public Updates" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: "Team Workspace" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("does not treat nested routes of other sections as active", () => {
    renderNav({ pathname: "/dashboard/projects/project-1/team/roster" });

    for (const name of [
      "Team Workspace",
      "Edit Project",
      "Public Updates",
      "Supporters",
    ]) {
      expect(screen.getByRole("link", { name })).not.toHaveAttribute(
        "aria-current",
      );
    }
  });

  it("does not mark any link active on the workspace root", () => {
    renderNav({ pathname: "/dashboard/projects/project-1" });

    expect(screen.queryAllByRole("link", { current: "page" })).toHaveLength(0);
  });

  it("does not activate a link for a different project with the same suffix", () => {
    renderNav({
      pathname: "/dashboard/projects/other-project/edit",
      projectId: "project-1",
    });

    expect(
      screen.getByRole("link", { name: "Edit Project" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("applies the active underline styling to the current link only", () => {
    renderNav({ pathname: "/dashboard/projects/project-1/edit" });

    expect(screen.getByRole("link", { name: "Edit Project" })).toHaveClass(
      "text-foreground",
    );
    expect(screen.getByRole("link", { name: "Supporters" })).not.toHaveClass(
      "text-foreground",
    );
  });
});
