import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SupporterExport } from "@/components/dashboard/supporter-list";

it("downloads from the authorized complete export endpoint", () => {
  render(<SupporterExport projectId="project-1" />);
  expect(screen.getByRole("link", { name: "Export CSV" })).toHaveAttribute(
    "href",
    "/api/projects/project-1/supporters/export",
  );
});
