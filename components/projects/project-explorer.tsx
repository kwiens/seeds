"use client";

import { useState } from "react";
import { BadgeFilter } from "@/components/projects/badge-filter";
import { CategoryFilter } from "@/components/projects/category-filter";
import { Pagination } from "@/components/projects/pagination";
import { SearchInput } from "@/components/projects/search-input";
import { ProjectListView } from "@/components/projects/project-list-view";
import { ProjectMapView } from "@/components/projects/project-map-view";
import { SortFilter } from "@/components/projects/sort-filter";
import { ViewToggle } from "@/components/projects/view-toggle";
import type { CategoryKey } from "@/config/categories";
import type { SortOption } from "@/lib/db/queries/projects";

export interface ProjectRow {
  id: string;
  name: string;
  summary: string;
  category: CategoryKey;
  imageUrl: string | null;
  coverPhotoUrl: string | null;
  locationLat: number | null;
  locationLng: number | null;
  stage: "seed" | "sprout" | "tree";
  approvalState: "draft" | "pending" | "approved";
  archivedAt: Date | null;
  createdBy: string;
  createdAt: Date;
  supportCount: number;
}

export interface MapProjectRow {
  id: string;
  name: string;
  category: CategoryKey;
  locationLat: number | null;
  locationLng: number | null;
}

interface SeedExplorerProps {
  projects: ProjectRow[];
  mapProjects: MapProjectRow[];
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

export function ProjectExplorer({
  projects,
  mapProjects,
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
          <ProjectListView projects={projects} />
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </>
      ) : (
        <ProjectMapView projects={mapProjects} />
      )}
    </>
  );
}
