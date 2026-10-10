"use client";

import { MapPin } from "lucide-react";
import { SeedMap } from "@/components/map/seed-map";
import { siteConfig } from "@/config/site";

export function SeedDetailMap({
  lat,
  lng,
  address,
}: {
  lat: number;
  lng: number;
  address?: string | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      <SeedMap
        singleMarker={{ lat, lng }}
        zoom={siteConfig.map.detailZoom}
        className="h-80 w-full rounded-lg sm:h-96"
        interactive
      />
      {address && (
        <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <MapPin className="size-3.5 shrink-0" />
          {address}
        </p>
      )}
    </div>
  );
}
