"use client";

import { useEffect, useState, useTransition } from "react";
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

              <div className="space-y-2 rounded-md border border-dashed p-3">
                <p className="text-muted-foreground text-xs font-medium">
                  Shown only when someone expands this event with &quot;Learn
                  more&quot; -- not in the always-visible summary.
                </p>
                <div className="space-y-2">
                  <Label htmlFor={`hf-event-${index}-details`}>
                    Additional details (optional)
                  </Label>
                  <Textarea
                    id={`hf-event-${index}-details`}
                    value={event.details ?? ""}
                    onChange={(e) =>
                      updateEvent(index, { details: e.target.value })
                    }
                    rows={3}
                    maxLength={3000}
                    placeholder="More to say than fits in the summary above?"
                  />
                </div>
                <ImageUpload
                  images={event.imageUrls ?? []}
                  onChange={(images) =>
                    updateEvent(index, { imageUrls: images })
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
                    updateEvent(index, {
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

type ProjectResult = { id: string; name: string; stage: ProjectStage };

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
    const timeout = setTimeout(() => {
      if (!trimmed) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      searchProjectsForHarvestFest(trimmed)
        .then(setResults)
        .finally(() => setIsSearching(false));
    }, 250);
    return () => clearTimeout(timeout);
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
