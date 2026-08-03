import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  timeOptionsWith,
  UpcomingEvents,
} from "@/components/seeds/upcoming-events";
import { updateEvent } from "@/lib/actions/team-events";
import type { ProjectEvent } from "@/lib/db/types";

vi.mock("@/lib/actions/team-events", () => ({
  createEvent: vi.fn().mockResolvedValue({}),
  updateEvent: vi.fn().mockResolvedValue({}),
  deleteEvent: vi.fn().mockResolvedValue({}),
}));

const earlyEvent: ProjectEvent = {
  id: "event-1",
  projectId: "seed-1",
  createdBy: "user-1",
  title: "Sunrise site visit",
  startsAt: new Date(2026, 8, 1, 6, 15),
  location: null,
  createdAt: new Date(2026, 7, 1),
  updatedAt: new Date(2026, 7, 1),
};

describe("timeOptionsWith", () => {
  it("returns the standard half-hour slots for an in-range time", () => {
    const options = timeOptionsWith("18:00");
    expect(options).toHaveLength(28);
    expect(options[0]).toBe("07:00");
    expect(options[options.length - 1]).toBe("20:30");
  });

  it("inserts an early out-of-range time in sorted position", () => {
    const options = timeOptionsWith("06:15");
    expect(options).toHaveLength(29);
    expect(options[0]).toBe("06:15");
    expect(options[1]).toBe("07:00");
  });

  it("appends a late out-of-range time at the end", () => {
    const options = timeOptionsWith("21:45");
    expect(options[options.length - 1]).toBe("21:45");
  });
});

describe("UpcomingEvents", () => {
  it("shows the event's out-of-range time when editing", () => {
    render(<UpcomingEvents seedId="seed-1" events={[earlyEvent]} canManage />);

    fireEvent.click(
      screen.getByRole("button", { name: /edit sunrise site visit/i }),
    );

    expect(screen.getByRole("combobox")).toHaveTextContent(/6:15\sAM/);
  });

  it("keeps the out-of-range time when saving without changes", async () => {
    render(<UpcomingEvents seedId="seed-1" events={[earlyEvent]} canManage />);

    fireEvent.click(
      screen.getByRole("button", { name: /edit sunrise site visit/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(updateEvent).toHaveBeenCalledOnce());
    const [eventId, data] = vi.mocked(updateEvent).mock.calls[0];
    const { startsAt } = data as { startsAt: Date };
    expect(eventId).toBe("event-1");
    expect(startsAt.getHours()).toBe(6);
    expect(startsAt.getMinutes()).toBe(15);
  });
});
