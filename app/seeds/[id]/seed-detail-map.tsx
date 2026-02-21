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
  const [expanded, setExpanded] = useState(true);

  const mapConfig = expanded
    ? {
        className: "h-80 w-full rounded-lg sm:h-96",
        zoom: 13,
        interactive: true,
      }
    : { className: "h-48 w-full rounded-lg", zoom: 14, interactive: false };

  return (
    <div className={expanded ? "col-span-full" : "flex flex-col gap-2"}>
      <div className="relative">
        <SeedMap
          key={expanded ? "expanded" : "collapsed"}
          singleMarker={{ lat, lng }}
          zoom={mapConfig.zoom}
          className={mapConfig.className}
          interactive={mapConfig.interactive}
        />
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-[5.25rem] left-2 size-8 shadow-md"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <Minimize2 className="size-3.5" />
          ) : (
            <Maximize2 className="size-3.5" />
          )}
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
