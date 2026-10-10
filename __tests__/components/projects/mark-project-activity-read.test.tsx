import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { MarkProjectActivityRead } from "@/components/projects/mark-project-activity-read";
import { markProjectActivityRead } from "@/lib/actions/team-activity";

vi.mock("@/lib/actions/team-activity", () => ({
  markProjectActivityRead: vi.fn().mockResolvedValue(undefined),
}));

describe("MarkProjectActivityRead", () => {
  beforeEach(() => {
    vi.mocked(markProjectActivityRead).mockClear();
  });

  it("renders nothing", () => {
    const { container } = render(
      <MarkProjectActivityRead
        projectId="seed-1"
        readThrough="2026-08-01T12:00:00.000Z"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("marks activity read on mount with the given seed and timestamp", () => {
    render(
      <MarkProjectActivityRead
        projectId="seed-1"
        readThrough="2026-08-01T12:00:00.000Z"
      />,
    );

    expect(markProjectActivityRead).toHaveBeenCalledExactlyOnceWith(
      "seed-1",
      "2026-08-01T12:00:00.000Z",
    );
  });

  it("does not fire again when re-rendered with the same props", () => {
    const { rerender } = render(
      <MarkProjectActivityRead
        projectId="seed-1"
        readThrough="2026-08-01T12:00:00.000Z"
      />,
    );
    rerender(
      <MarkProjectActivityRead
        projectId="seed-1"
        readThrough="2026-08-01T12:00:00.000Z"
      />,
    );

    expect(markProjectActivityRead).toHaveBeenCalledOnce();
  });

  it("fires again when readThrough changes", () => {
    const { rerender } = render(
      <MarkProjectActivityRead
        projectId="seed-1"
        readThrough="2026-08-01T12:00:00.000Z"
      />,
    );
    rerender(
      <MarkProjectActivityRead
        projectId="seed-1"
        readThrough="2026-08-02T09:30:00.000Z"
      />,
    );

    expect(markProjectActivityRead).toHaveBeenCalledTimes(2);
    expect(markProjectActivityRead).toHaveBeenLastCalledWith(
      "seed-1",
      "2026-08-02T09:30:00.000Z",
    );
  });
});
