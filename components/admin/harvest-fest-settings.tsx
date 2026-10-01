"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { setHarvestFestPage } from "@/lib/actions/admin";
import type {
  HarvestFestEvent,
  HarvestFestPage,
} from "@/lib/db/queries/settings";

const EMPTY_EVENT: HarvestFestEvent = {
  date: "",
  time: "",
  title: "",
  location: "",
  description: "",
};

export function HarvestFestSettings({ initial }: { initial: HarvestFestPage }) {
  const [title, setTitle] = useState(initial.title);
  const [tagline, setTagline] = useState(initial.tagline);
  const [intro, setIntro] = useState(initial.intro);
  const [events, setEvents] = useState(initial.events);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dirty =
    title !== initial.title ||
    tagline !== initial.tagline ||
    intro !== initial.intro ||
    JSON.stringify(events) !== JSON.stringify(initial.events);

  function updateEvent(index: number, patch: Partial<HarvestFestEvent>) {
    setEvents((prev) =>
      prev.map((event, i) => (i === index ? { ...event, ...patch } : event)),
    );
  }

  function addEvent() {
    setEvents((prev) => [...prev, { ...EMPTY_EVENT }]);
  }

  function removeEvent(index: number) {
    setEvents((prev) => prev.filter((_, i) => i !== index));
  }

  function moveEvent(index: number, direction: -1 | 1) {
    setEvents((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const updated = [...prev];
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated;
    });
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await setHarvestFestPage({
        title,
        tagline,
        intro,
        events,
      });
      if (result.success) {
        toast.success("Harvest Fest page updated");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="hf-title">Page title</Label>
        <Input
          id="hf-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="National Park City Harvest Fest"
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="hf-tagline">Tagline</Label>
        <Input
          id="hf-tagline"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="See what grew."
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="hf-intro">Intro</Label>
        <Textarea
          id="hf-intro"
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="This spring, we planted seeds across our city..."
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Events</Label>
          <Button type="button" variant="outline" size="sm" onClick={addEvent}>
            <Plus className="mr-1.5 size-4" />
            Add event
          </Button>
        </div>

        {events.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No events yet. Add the first one above.
          </p>
        )}

        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={index} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs font-medium">
                  Event {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    onClick={() => moveEvent(index, -1)}
                    aria-label={`Move event ${index + 1} up`}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === events.length - 1}
                    onClick={() => moveEvent(index, 1)}
                    aria-label={`Move event ${index + 1} down`}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEvent(index)}
                    aria-label={`Remove event ${index + 1}`}
                  >
                    <X className="text-destructive size-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`hf-event-${index}-date`}>Date</Label>
                  <Input
                    id={`hf-event-${index}-date`}
                    value={event.date}
                    onChange={(e) =>
                      updateEvent(index, { date: e.target.value })
                    }
                    placeholder="September 26"
                    maxLength={40}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`hf-event-${index}-time`}>Time</Label>
                  <Input
                    id={`hf-event-${index}-time`}
                    value={event.time}
                    onChange={(e) =>
                      updateEvent(index, { time: e.target.value })
                    }
                    placeholder="9 AM–3 PM"
                    maxLength={40}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`hf-event-${index}-title`}>Title</Label>
                <Input
                  id={`hf-event-${index}-title`}
                  value={event.title}
                  onChange={(e) =>
                    updateEvent(index, { title: e.target.value })
                  }
                  placeholder="The Play Street"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`hf-event-${index}-location`}>
                  Location (optional)
                </Label>
                <Input
                  id={`hf-event-${index}-location`}
                  value={event.location}
                  onChange={(e) =>
                    updateEvent(index, { location: e.target.value })
                  }
                  placeholder="Chestnut Street between 3rd & 4th"
                  maxLength={150}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`hf-event-${index}-description`}>
                  Description
                </Label>
                <Textarea
                  id={`hf-event-${index}-description`}
                  value={event.description}
                  onChange={(e) =>
                    updateEvent(index, { description: e.target.value })
                  }
                  rows={2}
                  maxLength={600}
                  placeholder="What's happening at this event?"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={save} disabled={!dirty || isPending}>
        {isPending ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
