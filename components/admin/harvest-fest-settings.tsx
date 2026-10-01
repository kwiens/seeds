"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Plus, Sprout, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/forms/image-upload";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  searchProjectsForHarvestFest,
  setHarvestFestPage,
} from "@/lib/actions/admin";
import type {
  HarvestFestEvent,
  HarvestFestPage,
} from "@/lib/db/queries/settings";
import { projectStages, type ProjectStage } from "@/lib/project-stages";

export function HarvestFestSettings({ initial }: { initial: HarvestFestPage }) {
  const [title, setTitle] = useState(initial.title);
  const [tagline, setTagline] = useState(initial.tagline);
  const [intro, setIntro] = useState(initial.intro);
  // Stable per-card ids so React state (and in-flight photo uploads) stay
  // with their event when events are reordered or removed. Initial ids are
  // index-based so server and client renders agree.
  const [events, setEvents] = useState<EditableEvent[]>(() =>
    initial.events.map((event, i) => ({ ...event, clientId: `saved-${i}` })),
  );
  const nextClientId = useRef(0);
  const [saved, setSaved] = useState(() => toPayload(initial));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const payload = toPayload({ title, tagline, intro, events });
  const dirty = JSON.stringify(payload) !== JSON.stringify(saved);

  function updateEvent(clientId: string, patch: Partial<HarvestFestEvent>) {
    setEvents((prev) =>
      prev.map((event) =>
        event.clientId === clientId ? { ...event, ...patch } : event,
      ),
    );
  }

  function addEvent() {
    nextClientId.current += 1;
    setEvents((prev) => [
      ...prev,
      { ...EMPTY_EVENT, clientId: `new-${nextClientId.current}` },
    ]);
  }

  function removeEvent(clientId: string) {
    setEvents((prev) => prev.filter((event) => event.clientId !== clientId));
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
      const result = await setHarvestFestPage(payload);
      if (result.success) {
        setSaved(payload);
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
            <div
              key={event.clientId}
              className="space-y-3 rounded-lg border p-4"
            >
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
                    onClick={() => removeEvent(event.clientId)}
                    aria-label={`Remove event ${index + 1}`}
                  >
                    <X className="text-destructive size-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`hf-event-${event.clientId}-date`}>
                    Date
                  </Label>
                  <Input
                    id={`hf-event-${event.clientId}-date`}
                    value={event.date}
                    onChange={(e) =>
                      updateEvent(event.clientId, { date: e.target.value })
                    }
                    placeholder="September 26"
                    maxLength={40}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`hf-event-${event.clientId}-time`}>
                    Time
                  </Label>
                  <Input
                    id={`hf-event-${event.clientId}-time`}
                    value={event.time}
                    onChange={(e) =>
                      updateEvent(event.clientId, { time: e.target.value })
                    }
                    placeholder="9 AM–3 PM"
                    maxLength={40}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`hf-event-${event.clientId}-title`}>
                  Title
                </Label>
                <Input
                  id={`hf-event-${event.clientId}-title`}
                  value={event.title}
                  onChange={(e) =>
                    updateEvent(event.clientId, { title: e.target.value })
                  }
                  placeholder="The Play Street"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`hf-event-${event.clientId}-location`}>
                  Location (optional)
                </Label>
                <Input
                  id={`hf-event-${event.clientId}-location`}
                  value={event.location}
                  onChange={(e) =>
                    updateEvent(event.clientId, { location: e.target.value })
                  }
                  placeholder="Chestnut Street between 3rd & 4th"
                  maxLength={150}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`hf-event-${event.clientId}-description`}>
                  Description
                </Label>
                <Textarea
                  id={`hf-event-${event.clientId}-description`}
                  value={event.description}
                  onChange={(e) =>
                    updateEvent(event.clientId, { description: e.target.value })
                  }
                  rows={2}
                  maxLength={600}
                  placeholder="What's happening at this event?"
                />
              </div>

              <div className="space-y-2 rounded-md border border-dashed p-3">
                <p className="text-muted-foreground text-xs font-medium">
                  Shown only when someone expands this event with &quot;Learn
                  more&quot; -- not in the always-visible summary.
                </p>
                <div className="space-y-2">
                  <Label htmlFor={`hf-event-${event.clientId}-details`}>
                    Additional details (optional)
                  </Label>
                  <Textarea
                    id={`hf-event-${event.clientId}-details`}
                    value={event.details ?? ""}
                    onChange={(e) =>
                      updateEvent(event.clientId, { details: e.target.value })
                    }
                    rows={3}
                    maxLength={3000}
                    placeholder="More to say than fits in the summary above?"
                  />
                </div>
                <ImageUpload
                  images={event.imageUrls ?? []}
                  onChange={(images) =>
                    updateEvent(event.clientId, { imageUrls: images })
                  }
                  maxImages={6}
                  label="Photos or flyers"
                />
              </div>

              <div className="space-y-2">
                <Label>Linked Seed or Sprout (optional)</Label>
                <ProjectLinkPicker
                  projectId={event.projectId}
                  projectName={event.projectName}
                  onChange={(project) =>
                    updateEvent(event.clientId, {
                      projectId: project?.id,
                      projectName: project?.name,
                    })
                  }
                />
                <p className="text-muted-foreground text-xs">
                  Shows &quot;Sprouted from: [name]&quot; on the public page,
                  linking to that Seed or Sprout&apos;s page.
                </p>
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

function ProjectLinkPicker({
  projectId,
  projectName,
  onChange,
}: {
  projectId: string | undefined;
  projectName: string | undefined;
  onChange: (project: ProjectResult | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProjectResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    // Ignore responses for superseded queries so a slow earlier search can't
    // overwrite the results for what the admin has typed since.
    let current = true;
    const timeout = setTimeout(() => {
      if (!trimmed) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      searchProjectsForHarvestFest(trimmed)
        .then((rows) => {
          if (current) setResults(rows);
        })
        .catch(() => {
          if (current) setResults([]);
        })
        .finally(() => {
          if (current) setIsSearching(false);
        });
    }, 250);
    return () => {
      current = false;
      clearTimeout(timeout);
    };
  }, [query, open]);

  if (projectId && projectName) {
    return (
      <div className="flex items-center gap-2">
        <span className="bg-accent inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm">
          <Sprout className="size-3.5" aria-hidden="true" />
          {projectName}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(null)}
        >
          <X className="mr-1 size-3.5" />
          Unlink
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus className="mr-1.5 size-4" />
          Link a Seed or Sprout
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search by name..."
          />
          <CommandList>
            {!isSearching && query.trim() && results.length === 0 && (
              <CommandEmpty>No matching project found.</CommandEmpty>
            )}
            <CommandGroup>
              {results.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.id}
                  onSelect={() => {
                    onChange(project);
                    setQuery("");
                    setResults([]);
                    setOpen(false);
                  }}
                >
                  {project.name}
                  <span className="text-muted-foreground ml-auto text-xs">
                    {projectStages[project.stage].label}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function toPayload(state: {
  title: string;
  tagline: string;
  intro: string;
  events: HarvestFestEvent[];
}): HarvestFestPage {
  return {
    title: state.title.trim(),
    tagline: state.tagline.trim(),
    intro: state.intro.trim(),
    events: state.events.map((event) => ({
      date: event.date.trim(),
      time: event.time.trim(),
      title: event.title.trim(),
      location: event.location.trim(),
      description: event.description.trim(),
      details: event.details?.trim() || undefined,
      imageUrls: event.imageUrls?.length ? event.imageUrls : undefined,
      projectId: event.projectId || undefined,
      projectName: event.projectName || undefined,
    })),
  };
}

const EMPTY_EVENT: HarvestFestEvent = {
  date: "",
  time: "",
  title: "",
  location: "",
  description: "",
};

type EditableEvent = HarvestFestEvent & { clientId: string };

type ProjectResult = { id: string; name: string; stage: ProjectStage };
