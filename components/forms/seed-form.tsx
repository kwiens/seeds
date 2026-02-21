"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
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

interface SeedFormProps {
  seed?: Seed;
}

export function SeedForm({ seed }: SeedFormProps) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(seed?.name ?? "");
  const [summary, setSummary] = useState(seed?.summary ?? "");
  const [gardeners, setGardeners] = useState<string[]>(seed?.gardeners ?? []);
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
  const [roots, setRoots] = useState<string[]>(seed?.roots ?? []);
  const [supportPeople, setSupportPeople] = useState<string[]>(
    seed?.supportPeople ?? [],
  );
  const [waterHave, setWaterHave] = useState<string[]>(seed?.waterHave ?? []);
  const [waterNeed, setWaterNeed] = useState<string[]>(seed?.waterNeed ?? []);
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
          <Label htmlFor="summary">Summary (The Idea)</Label>
          <Textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={10000}
            placeholder="Describe your idea for Chattanooga..."
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
          label="Gardeners (People posting this idea)"
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

        {/* Roots */}
        <SortableList
          items={roots}
          onItemsChange={setRoots}
          label="Roots (Organizations)"
          placeholder="Add an organization..."
        />

        {/* Support people */}
        <SortableList
          items={supportPeople}
          onItemsChange={setSupportPeople}
          label="Support (People)"
          placeholder="Add a person..."
        />

        {/* Water: Have */}
        <SortableList
          items={waterHave}
          onItemsChange={setWaterHave}
          label="Water: What do you have?"
          placeholder="e.g. Funding, materials, venue..."
        />

        {/* Water: Need */}
        <SortableList
          items={waterNeed}
          onItemsChange={setWaterNeed}
          label="Water: What do you need?"
          placeholder="e.g. Volunteers, permits, equipment..."
        />

        {/* Illustration (edit mode only) */}
        {seed && (
          <div className="space-y-3">
            <Label>Illustration</Label>
            {imageUrl ? (
              <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-lg">
                <Image
                  src={imageUrl}
                  alt={seed.name}
                  fill
                  className="object-cover"
                  sizes="320px"
                />
              </div>
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
          {isPending
            ? "Planting..."
            : seed
              ? "Update Seed"
              : "Plant This Seed"}
        </Button>
      </fieldset>
    </form>
  );
}
