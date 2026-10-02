import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LinkifyText } from "@/components/linkify-text";

describe("LinkifyText", () => {
  it("renders plain text without links", () => {
    const { container } = render(<LinkifyText text="No links here." />);
    expect(container.textContent).toBe("No links here.");
    expect(container.querySelector("a")).toBeNull();
  });

  it("links URLs and keeps trailing punctuation outside the link", () => {
    const { container } = render(
      <LinkifyText text="Tickets at https://example.com/tix. See you!" />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com/tix");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(container.textContent).toBe(
      "Tickets at https://example.com/tix (opens in new tab). See you!",
    );
  });

  it("links multiple URLs", () => {
    render(<LinkifyText text="http://a.example and https://b.example" />);
    expect(
      screen.getAllByRole("link").map((a) => a.getAttribute("href")),
    ).toEqual(["http://a.example", "https://b.example"]);
  });

  it("does not link non-http schemes", () => {
    render(<LinkifyText text="javascript:alert(1)" />);
    expect(screen.queryByRole("link")).toBeNull();
  });
});
