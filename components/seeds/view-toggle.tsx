"use client";

import { LayoutGrid, Map } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ViewToggle({
  view,
  onViewChange,
}: {
  view: "grid" | "map";
  onViewChange: (view: "grid" | "map") => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg border p-1">
      <Button
        variant={view === "grid" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewChange("grid")}
        className="gap-1.5"
      >
        <LayoutGrid className="size-4" />
        <span className="hidden sm:inline">Grid</span>
      </Button>
      <Button
        variant={view === "map" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewChange("map")}
        className="gap-1.5"
      >
        <Map className="size-4" />
        <span className="hidden sm:inline">Map</span>
      </Button>
    </div>
  );
}
