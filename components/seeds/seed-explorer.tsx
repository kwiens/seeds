"use client";

import { useState } from "react";
import { BadgeFilter } from "@/components/seeds/badge-filter";
import { CategoryFilter } from "@/components/seeds/category-filter";
import { Pagination } from "@/components/seeds/pagination";
import { SearchInput } from "@/components/seeds/search-input";
import { SeedListView } from "@/components/seeds/seed-list-view";
import { SeedMapView } from "@/components/seeds/seed-map-view";
import { SortFilter } from "@/components/seeds/sort-filter";
import { ViewToggle } from "@/components/seeds/view-toggle";
import type { CategoryKey } from "@/lib/categories";
import type { SortOption } from "@/lib/db/queries/seeds";

export interface SeedRow {
  id: string;
  name: string;
  summary: string;
  category: CategoryKey;
  imageUrl: string | null;
  coverPhotoUrl: string | null;
  locationLat: number | null;
  locationLng: number | null;
  status: string;
  createdBy: string;
  createdAt: Date;
  supportCount: number;
}

export interface MapSeedRow {
  id: string;
  name: string;
  category: CategoryKey;
  locationLat: number | null;
  locationLng: number | null;
}

interface SeedExplorerProps {
  seeds: SeedRow[];
  mapSeeds: MapSeedRow[];
  currentPage: number;
  totalPages: number;
  activeCategory?: CategoryKey;
  activeBadges?: string[];
  activeSort?: SortOption;
  isSignedIn?: boolean;
  showCategoryFilter?: boolean;
  showBadgeFilter?: boolean;
  showSort?: boolean;
}

export function SeedExplorer({
  seeds,
  mapSeeds,
  currentPage,
  totalPages,
  activeCategory,
  activeBadges = [],
  activeSort = "newest",
  isSignedIn,
  showCategoryFilter = false,
  showBadgeFilter = false,
  showSort = true,
}: SeedExplorerProps) {
  const [view, setView] = useState<"grid" | "map">("grid");

  return (
    <>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput />
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onViewChange={setView} />
          {view === "grid" && showSort && (
            <SortFilter activeSort={activeSort} isSignedIn={isSignedIn} />
          )}
        </div>
      </div>

      {showCategoryFilter && (
        <div className="mb-6">
          <CategoryFilter activeCategory={activeCategory} />
        </div>
      )}

      {showBadgeFilter && (
        <div className="mb-6">
          <BadgeFilter activeBadges={activeBadges} />
        </div>
      )}

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
