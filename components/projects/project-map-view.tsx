"use client";

import { ProjectMap } from "@/components/map/project-map";
import type { CategoryKey } from "@/config/categories";

interface MapProjectData {
  id: string;
  name: string;
  category: CategoryKey;
  locationLat: number | null;
  locationLng: number | null;
}

export function ProjectMapView({ projects }: { projects: MapProjectData[] }) {
  const projectsWithLocation = projects.filter(
    (s) => s.locationLat != null && s.locationLng != null,
  );

  return (
    <ProjectMap
      projects={projectsWithLocation}
      className="h-[500px] w-full rounded-lg"
    />
  );
}
