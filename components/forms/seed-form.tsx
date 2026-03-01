"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { GripVertical, Info, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeedIcon } from "@/components/icons/seed-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RegenerateImageButton } from "@/components/seeds/regenerate-image-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortableList } from "@/components/forms/sortable-list";
import { LocationPicker } from "@/components/forms/location-picker";
import { SignInButton } from "@/components/auth/sign-in-button";
import { categories, categoryKeys, type CategoryKey } from "@/lib/categories";
import { createSeed, updateSeed } from "@/lib/actions/seeds";
import type { Seed } from "@/lib/db/types";
import { cn } from "@/lib/utils";

interface RootItem {
  name: string;
  committed: boolean;
}

function parseRoots(raw: unknown): RootItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === "string") return { name: item, committed: false };
    if (typeof item === "object" && item && "name" in item) {
      return {
        name: String((item as RootItem).name),
        committed: Boolean((item as RootItem).committed),
      };
    }
    return { name: String(item), committed: false };
  });
}

function FieldInfoLink({ anchor }: { anchor: string }) {
  return (
    <a
      href={`/about#seed-${anchor}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-muted-foreground hover:text-foreground"
      title="Learn more"
    >
      <Info className="size-3.5" />
    </a>
  );
}

interface SeedFormProps {
  seed?: Seed;
  planterName?: string;
}

export function SeedForm({ seed, planterName }: SeedFormProps) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(seed?.name ?? "");
  const [summary, setSummary] = useState(seed?.summary ?? "");
  const [gardeners, setGardeners] = useState<string[]>(
    seed?.gardeners ?? (planterName ? [planterName] : []),
  );
  const [locationAddress, setLocationAddress] = useState(
    seed?.locationAddress ?? "",
  );
  const [locationLat, setLocationLat] = useState<number | null>(
    seed?.locationLat ?? null,
  );
  const [locationLng, setLocationLng] = useState<number | null>(
    seed?.locationLng ?? null,
  );
  const [category, setCategory] = useState<CategoryKey | "">(
    (seed?.category as CategoryKey) ?? "",
  );
  const [roots, setRoots] = useState<RootItem[]>(parseRoots(seed?.roots));
  const [supportPeople, setSupportPeople] = useState<string[]>(
    seed?.supportPeople ?? [],
  );
  const [waterHave, setWaterHave] = useState<string[]>(seed?.waterHave ?? []);
  const [waterNeed, setWaterNeed] = useState<string[]>(seed?.waterNeed ?? []);
  const [obstacles, setObstacles] = useState(seed?.obstacles ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(
    seed?.imageUrl ?? null,
  );

  const isSignedIn = !!session?.user;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!category) {
      setError("Please select a category.");
      return;
    }

    const formData = {
      name,
      summary,
      gardeners,
      locationAddress: locationAddress || undefined,
      locationLat: locationLat ?? undefined,
      locationLng: locationLng ?? undefined,
      category,
      roots,
      supportPeople,
      waterHave,
      waterNeed,
      obstacles: obstacles || undefined,
    };

    startTransition(async () => {
      const result = seed
        ? await updateSeed(seed.id, formData)
        : await createSeed(formData);

      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isSignedIn && (
        <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-6 text-center">
          <p className="mb-3 text-sm text-muted-foreground">
            Sign in with Google to plant your seed
          </p>
          <SignInButton />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <fieldset disabled={!isSignedIn || isPending} className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name of Project</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={160}
            placeholder="Give your seed a name..."
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {name.length}/160 characters
          </p>
        </div>

        {/* Summary */}
        <div className="space-y-2">
          <Label htmlFor="summary" className="flex items-center gap-2">
            <SeedIcon name="idea" />
            Summary (The Idea)
            <FieldInfoLink anchor="name" />
          </Label>
          <Textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={10000}
            placeholder="Describe your idea for the community..."
            rows={6}
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.length}/10,000 characters
          </p>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={category}
            onValueChange={(val) => setCategory(val as CategoryKey)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category..." />
            </SelectTrigger>
            <SelectContent>
              {categoryKeys.map((key) => {
                const info = categories[key];
                const Icon = info.icon;
                return (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <Icon className="size-4" />
                      {info.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Gardeners */}
        <SortableList
          items={gardeners}
          onItemsChange={setGardeners}
          label={
            <>
              <SeedIcon name="gardeners" />
              Gardeners (Project organizers)
              <FieldInfoLink anchor="gardeners" />
            </>
          }
          placeholder="Add a gardener..."
        />

        {/* Location */}
        <LocationPicker
          address={locationAddress}
          lat={locationLat}
          lng={locationLng}
          onLocationChange={({ address, lat, lng }) => {
            setLocationAddress(address);
            setLocationLat(lat);
            setLocationLng(lng);
          }}
        />

        {/* Roots (Organizations) */}
        <RootsList roots={roots} onRootsChange={setRoots} />

        {/* Guides (People) */}
        <SortableList
          items={supportPeople}
          onItemsChange={setSupportPeople}
          label={
            <>
              <SeedIcon name="support" />
              Guides (People)
              <FieldInfoLink anchor="support" />
            </>
          }
          placeholder="Add a person..."
        />

        {/* Fertilizer: What do you have? */}
        <SortableList
          items={waterHave}
          onItemsChange={setWaterHave}
          label={
            <>
              <SeedIcon name="soil" />
              Fertilizer: What do you have?
              <FieldInfoLink anchor="soil" />
            </>
          }
          placeholder="e.g. Funding, materials, venue..."
        />

        {/* Water: What resources and funding do you need? */}
        <SortableList
          items={waterNeed}
          onItemsChange={setWaterNeed}
          label={
            <>
              <SeedIcon name="water" />
              Water: What resources and funding do you need?
              <FieldInfoLink anchor="water" />
            </>
          }
          placeholder="e.g. Volunteers, money for materials, equipment..."
        />

        {/* Obstacles */}
        <div className="space-y-2">
          <Label htmlFor="obstacles" className="flex items-center gap-2">
            Obstacles
          </Label>
          <Textarea
            id="obstacles"
            value={obstacles}
            onChange={(e) => setObstacles(e.target.value)}
            maxLength={10000}
            placeholder="Known obstacles, roadblocks, or challenges..."
            rows={4}
          />
        </div>

        {/* Illustration (edit mode only) */}
        {seed && (
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <SeedIcon name="harvest" />
              Illustration
            </Label>
            <p className="text-xs text-muted-foreground">
              Improve the image by editing your description
            </p>
            {imageUrl ? (
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block max-w-xs overflow-hidden rounded-lg"
              >
                <Image
                  src={imageUrl}
                  alt={seed.name}
                  width={320}
                  height={320}
                  className="h-auto w-full"
                  sizes="320px"
                />
              </a>
            ) : (
              <p className="text-muted-foreground text-sm">
                No image generated yet.
              </p>
            )}
            <RegenerateImageButton
              seedId={seed.id}
              hasImage={!!imageUrl}
              onImageGenerated={setImageUrl}
            />
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Planting..." : seed ? "Update Seed" : "Plant This Seed"}
        </Button>
      </fieldset>
    </form>
  );
}

function RootsList({
  roots,
  onRootsChange,
}: {
  roots: RootItem[];
  onRootsChange: (roots: RootItem[]) => void;
}) {
  const [newRoot, setNewRoot] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function addRoot() {
    const trimmed = newRoot.trim();
    if (!trimmed) return;
    onRootsChange([...roots, { name: trimmed, committed: false }]);
    setNewRoot("");
  }

  function removeRoot(index: number) {
    onRootsChange(roots.filter((_, i) => i !== index));
  }

  function toggleCommitted(index: number) {
    const updated = [...roots];
    updated[index] = {
      ...updated[index],
      committed: !updated[index].committed,
    };
    onRootsChange(updated);
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const updated = [...roots];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    onRootsChange(updated);
    setDragIndex(index);
  }

  function handleDragEnd() {
    setDragIndex(null);
  }

  return (
    <div>
      <span className="mb-2 flex items-center gap-2 text-sm font-medium">
        <SeedIcon name="roots" />
        Roots (Organizations)
        <FieldInfoLink anchor="roots" />
      </span>
      {roots.length > 0 && (
        <ul className="mb-2 space-y-1">
          {roots.map((root, index) => (
            <li
              key={`${root.name}-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-sm",
                dragIndex === index && "opacity-50",
              )}
            >
              <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" />
              <span className="flex-1">{root.name}</span>
              <button
                type="button"
                onClick={() => toggleCommitted(index)}
                className={cn(
                  "shrink-0 rounded px-2 py-0.5 text-xs font-medium",
                  root.committed
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {root.committed ? "Committed" : "Not committed yet"}
              </button>
              <button
                type="button"
                onClick={() => removeRoot(index)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          value={newRoot}
          onChange={(e) => setNewRoot(e.target.value)}
          placeholder="Add an organization..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addRoot();
            }
          }}
        />
        <Button type="button" variant="outline" size="icon" onClick={addRoot}>
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
