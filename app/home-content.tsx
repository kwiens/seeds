"use client";

import {
  SeedExplorer,
  type SeedRow,
  type MapSeedRow,
} from "@/components/seeds/seed-explorer";
import type { CategoryKey } from "@/lib/categories";
import type { SortOption } from "@/lib/db/queries/seeds";

export function HomeContent({
  seeds,
  mapSeeds,
  currentPage,
  totalPages,
  activeCategory,
  activeSort = "newest",
  isSignedIn,
}: {
  seeds: SeedRow[];
  mapSeeds: MapSeedRow[];
  currentPage: number;
  totalPages: number;
  activeCategory?: CategoryKey;
  activeSort?: SortOption;
  isSignedIn?: boolean;
}) {
  return (
    <SeedExplorer
      seeds={seeds}
      mapSeeds={mapSeeds}
      currentPage={currentPage}
      totalPages={totalPages}
      activeCategory={activeCategory}
      activeSort={activeSort}
      isSignedIn={isSignedIn}
      showCategoryFilter={true}
      showBadgeFilter={false}
    />
  );
}
