"use client";

import { SeedMap } from "@/components/map/seed-map";
import type { CategoryKey } from "@/lib/categories";

interface MapSeedData {
  id: string;
  name: string;
  category: CategoryKey;
  locationLat: number | null;
  locationLng: number | null;
}

export function SeedMapView({ seeds }: { seeds: MapSeedData[] }) {
  const seedsWithLocation = seeds.filter(
    (s) => s.locationLat != null && s.locationLng != null,
  );

  return (
    <SeedMap
      seeds={seedsWithLocation}
      className="h-[500px] w-full rounded-lg"
    />
  );
}
