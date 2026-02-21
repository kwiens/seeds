"use client";

import { useState } from "react";
import { CategoryFilter } from "@/components/seeds/category-filter";
import { Pagination } from "@/components/seeds/pagination";
import { SeedListView } from "@/components/seeds/seed-list-view";
import { SeedMapView } from "@/components/seeds/seed-map-view";
import { SortFilter } from "@/components/seeds/sort-filter";
import { ViewToggle } from "@/components/seeds/view-toggle";
import type { CategoryKey } from "@/lib/categories";
import type { SortOption } from "@/lib/db/queries/seeds";

interface SeedRow {
  id: string;
  name: string;
  summary: string;
  category: CategoryKey;
  imageUrl: string | null;
  locationLat: number | null;
  locationLng: number | null;
  status: string;
  createdBy: string;
  createdAt: Date;
  supportCount: number;
}

interface MapSeedRow {
  id: string;
  name: string;
  category: CategoryKey;
  locationLat: number | null;
  locationLng: number | null;
}

export function HomeContent({
  seeds,
  mapSeeds,
  currentPage,
  totalPages,
  activeCategory,
  activeSort = "newest",
}: {
  seeds: SeedRow[];
  mapSeeds: MapSeedRow[];
  currentPage: number;
  totalPages: number;
  activeCategory?: CategoryKey;
  activeSort?: SortOption;
}) {
  const [view, setView] = useState<"grid" | "map">("grid");

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CategoryFilter activeCategory={activeCategory} />
        <div className="flex flex-col items-end gap-2">
          <ViewToggle view={view} onViewChange={setView} />
          <SortFilter activeSort={activeSort} />
        </div>
      </div>

      {view === "grid" ? (
        <>
          <SeedListView seeds={seeds} />
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </>
      ) : (
        <SeedMapView seeds={mapSeeds} />
      )}
    </>
  );
}
