"use client";

import { SeedMap } from "@/components/map/seed-map";

export function SeedDetailMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <SeedMap
      singleMarker={{ lat, lng }}
      zoom={14}
      className="h-48 w-full rounded-lg"
      interactive={false}
    />
  );
}
