"use client";

import { useState, useTransition } from "react";
import {
  Calendar as CalendarIcon,
  MapPin,
  Pencil,
  Trash2,
  Video,
} from "lucide-react";
import { AddressAutocomplete } from "@/components/forms/address-autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createEvent,
  deleteEvent,
  updateEvent,
} from "@/lib/actions/team-events";
import type { TeamEvent } from "@/lib/db/types";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DOW_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const TIME_OPTIONS: string[] = [];
for (let h = 7; h <= 20; h++) {
  for (const m of [0, 30]) {
    TIME_OPTIONS.push(
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    );
  }
}

function formatTimeLabel(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isRemoteLocation(location: string) {
  return /^https?:\/\//i.test(location.trim());
}

function formatWhen(date: Date) {
  const day = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day} · ${time}`;
}

function toGCalUTC(date: Date) {
  return date.toISOString().replace(/[-:]|\.\d{3}/g, "");
}

function gcalLink(title: string, start: Date, location: string) {
  const end = new Date(start.getTime() + 60 * 60000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toGCalUTC(start)}/${toGCalUTC(end)}`,
    location,
    details: "Added from the Sprout's Team page.",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function sameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function DatePicker({
  value,
  onChange,
}: {
  value: Date | null;
  onChange: (date: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(value ?? new Date());

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "border-input flex h-9 w-full items-center gap-2 rounded-md border bg-transparent px-3 text-left text-sm",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="size-3.5 shrink-0" />
          {value
            ? value.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })
            : "Select date"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setViewMonth(new Date(year, month - 1, 1))}
            className="hover:bg-accent flex size-6 items-center justify-center rounded"
          >
            ‹
          </button>
          <span className="text-sm font-bold">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setViewMonth(new Date(year, month + 1, 1))}
            className="hover:bg-accent flex size-6 items-center justify-center rounded"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {DOW_LABELS.map((d) => (
            <div
              key={d}
              className="text-muted-foreground pb-1 text-center text-[0.65rem] font-bold"
            >
              {d}
            </div>
          ))}
          {cells.map((cellDate, i) => {
            if (!cellDate) return <div key={i} />;
            const isPast = cellDate < today;
            return (
              <button
                key={cellDate.toISOString()}
                type="button"
                disabled={isPast}
                onClick={() => {
                  onChange(cellDate);
                  setOpen(false);
                }}
                className={cn(
                  "flex aspect-square items-center justify-center rounded text-sm tabular-nums",
                  isPast
                    ? "text-muted-foreground opacity-30"
                    : "hover:bg-accent",
                  sameDay(cellDate, today) && "ring-primary ring-1 ring-inset",
                  sameDay(cellDate, value) &&
                    "bg-primary text-primary-foreground font-bold hover:bg-primary",
                )}
              >
                {cellDate.getDate()}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function EventForm({
  seedId,
  editingEvent,
  onDone,
}: {
  seedId: string;
  editingEvent: TeamEvent | null;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(editingEvent?.title ?? "");
  const [date, setDate] = useState<Date | null>(
    editingEvent ? new Date(editingEvent.startsAt) : null,
  );
  const [time, setTime] = useState(() => {
    if (!editingEvent) return "18:00";
    const d = new Date(editingEvent.startsAt);
    const h = String(d.getHours()).padStart(2, "0");
    const m = d.getMinutes() < 30 ? "00" : "30";
    return `${h}:${m}`;
  });
  const [location, setLocation] = useState(editingEvent?.location ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!title.trim() || !date) return;
    setError(null);

    const [h, m] = time.split(":").map(Number);
    const startsAt = new Date(date);
    startsAt.setHours(h, m, 0, 0);

    startTransition(async () => {
      const result = editingEvent
        ? await updateEvent(editingEvent.id, {
            title,
            startsAt,
            location: location.trim() || undefined,
          })
        : await createEvent(seedId, {
            title,
            startsAt,
            location: location.trim() || undefined,
          });
      if (result.error) {
        setError(result.error);
        return;
      }
      onDone();
    });
  }

  return (
    <div className="mt-3 space-y-2 rounded-md border p-3">
      {error && (
        <p className="bg-destructive/10 text-destructive rounded-md px-2 py-1.5 text-xs">
          {error}
        </p>
      )}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Event title — e.g. Site visit"
        maxLength={200}
      />
      <div className="grid grid-cols-2 gap-2">
        <DatePicker value={date} onChange={setDate} />
        <Select value={time} onValueChange={setTime}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {formatTimeLabel(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <AddressAutocomplete
        value={location}
        onChange={setLocation}
        placeholder="Location — address, or a Zoom/Meet link"
        maxLength={300}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isPending || !title.trim() || !date}
        >
          {editingEvent ? "Save Changes" : "Save Event"}
        </Button>
      </div>
    </div>
  );
}

function EventRow({
  event,
  canManage,
  onEdit,
}: {
  event: TeamEvent;
  canManage: boolean;
  onEdit: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const start = new Date(event.startsAt);
  const location = event.location ?? "";
  const remote = isRemoteLocation(location);

  function handleDelete() {
    if (!window.confirm(`Delete "${event.title}"?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteEvent(event.id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex gap-2.5 rounded-md border p-2.5">
      <div className="bg-accent flex size-11 shrink-0 flex-col items-center justify-center rounded-lg leading-none">
        <span className="text-primary text-[0.6rem] font-bold tracking-wide uppercase">
          {MONTH_ABBR[start.getMonth()]}
        </span>
        <span className="mt-0.5 text-base font-extrabold tabular-nums">
          {start.getDate()}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-1.5">
          <p className="text-sm font-semibold">{event.title}</p>
          {canManage && (
            <div className="flex shrink-0 gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit ${event.title}`}
                className="size-6"
                onClick={onEdit}
              >
                <Pencil className="text-muted-foreground size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${event.title}`}
                className="size-6"
                disabled={isPending}
                onClick={handleDelete}
              >
                <Trash2 className="text-muted-foreground hover:text-destructive size-3" />
              </Button>
            </div>
          )}
        </div>
        <p className="text-muted-foreground text-xs">{formatWhen(start)}</p>
        {location &&
          (remote ? (
            <a
              href={location}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
            >
              <Video className="size-2.5" />
              Join online
            </a>
          ) : (
            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
              <MapPin className="size-2.5" />
              {location}
            </span>
          ))}
        <a
          href={gcalLink(event.title, start, location)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary mt-1.5 flex items-center gap-1 text-xs font-medium hover:underline"
        >
          <CalendarIcon className="size-2.5" />
          Add to Google Calendar
        </a>
        {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
      </div>
    </div>
  );
}

export function UpcomingEvents({
  seedId,
  events,
  canManage,
}: {
  seedId: string;
  events: TeamEvent[];
  canManage: boolean;
}) {
  const [formState, setFormState] = useState<"closed" | "add" | TeamEvent>(
    "closed",
  );

  return (
    <div className="rounded-lg border p-4">
      <h4 className="mb-3 text-sm font-semibold">Upcoming Events</h4>

      {events.length === 0 ? (
        <p className="text-muted-foreground mb-3 text-xs">
          No events scheduled yet.
        </p>
      ) : (
        <div className="mb-3 space-y-2">
          {events.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              canManage={canManage}
              onEdit={() => setFormState(event)}
            />
          ))}
        </div>
      )}

      {canManage &&
        (formState === "closed" ? (
          <button
            type="button"
            onClick={() => setFormState("add")}
            className="text-muted-foreground hover:border-primary hover:text-foreground w-full rounded-md border border-dashed px-3 py-2 text-sm"
          >
            + Add event
          </button>
        ) : (
          <EventForm
            key={formState === "add" ? "add" : formState.id}
            seedId={seedId}
            editingEvent={formState === "add" ? null : formState}
            onDone={() => setFormState("closed")}
          />
        ))}
    </div>
  );
}
