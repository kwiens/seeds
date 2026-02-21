"use client";

import { useState } from "react";
import { Maximize2, Minimize2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeedMap } from "@/components/map/seed-map";

export function SeedDetailMap({
  lat,
  lng,
  address,
}: {
  lat: number;
  lng: number;
  address?: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  if (expanded) {
    return (
      <div className="col-span-full">
        <div className="relative">
          <SeedMap
            singleMarker={{ lat, lng }}
            zoom={13}
            className="h-80 w-full rounded-lg sm:h-96"
            interactive
          />
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-2 right-2 size-8 shadow-md"
            onClick={() => setExpanded(false)}
          >
            <Minimize2 className="size-3.5" />
          </Button>
        </div>
        {address && (
          <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-sm">
            <MapPin className="size-3.5 shrink-0" />
            {address}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <SeedMap
          singleMarker={{ lat, lng }}
          zoom={14}
          className="h-48 w-full rounded-lg"
          interactive={false}
        />
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-2 right-2 size-8 shadow-md"
          onClick={() => setExpanded(true)}
        >
          <Maximize2 className="size-3.5" />
        </Button>
      </div>
      {address && (
        <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <MapPin className="size-3.5 shrink-0" />
          {address}
        </p>
      )}
    </div>
  );
}
