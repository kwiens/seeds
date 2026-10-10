"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Map, { Marker, NavigationControl, Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Sprout } from "lucide-react";
import { categories, type CategoryKey } from "@/config/categories";
import { siteConfig } from "@/config/site";
import { MAPBOX_TOKEN } from "@/lib/mapbox-search";
import { routes } from "@/lib/routes";

interface MapProject {
  id: string;
  name: string;
  category: CategoryKey;
  locationLat: number | null;
  locationLng: number | null;
}

interface ProjectMapProps {
  projects?: MapProject[];
  center?: { latitude: number; longitude: number };
  zoom?: number;
  singleMarker?: { lat: number; lng: number };
  className?: string;
  interactive?: boolean;
  onMarkerClick?: (projectId: string) => void;
}

export function ProjectMap({
  projects = [],
  center = siteConfig.map.center,
  zoom = siteConfig.map.zoom,
  singleMarker,
  className = "h-96 w-full rounded-lg",
  interactive = true,
  onMarkerClick,
}: ProjectMapProps) {
  const [popupProject, setPopupProject] = useState<MapProject | null>(null);

  const handleMarkerClick = useCallback(
    (project: MapProject) => {
      if (onMarkerClick) {
        onMarkerClick(project.id);
      } else {
        setPopupProject(project);
      }
    },
    [onMarkerClick],
  );

  return (
    <div className={className}>
      <Map
        initialViewState={{
          latitude: singleMarker?.lat ?? center.latitude,
          longitude: singleMarker?.lng ?? center.longitude,
          zoom,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={siteConfig.map.style}
        mapboxAccessToken={MAPBOX_TOKEN}
        interactive={interactive}
        cooperativeGestures
      >
        <NavigationControl position="top-left" showCompass={false} />

        {singleMarker && (
          <Marker latitude={singleMarker.lat} longitude={singleMarker.lng}>
            <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Sprout className="size-4" />
            </div>
          </Marker>
        )}

        {projects.map((project) => {
          if (!project.locationLat || !project.locationLng) return null;
          const info = categories[project.category];
          return (
            <Marker
              key={project.id}
              latitude={project.locationLat}
              longitude={project.locationLng}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(project);
              }}
            >
              <button
                type="button"
                aria-label={project.name}
                className={`flex size-8 items-center justify-center rounded-full bg-gradient-to-br shadow-lg transition-transform hover:scale-110 ${info.gradient}`}
              >
                <Sprout className="size-4 text-white" />
              </button>
            </Marker>
          );
        })}

        {popupProject &&
          popupProject.locationLat &&
          popupProject.locationLng && (
            <Popup
              latitude={popupProject.locationLat}
              longitude={popupProject.locationLng}
              onClose={() => setPopupProject(null)}
              closeButton
              closeOnClick={false}
              offset={12}
            >
              <Link
                href={routes.project(popupProject.id)}
                className="block pr-4 no-underline"
              >
                <p className="text-sm font-semibold">{popupProject.name}</p>
                <p className="text-muted-foreground text-xs">
                  {categories[popupProject.category].label}
                </p>
              </Link>
            </Popup>
          )}
      </Map>
    </div>
  );
}
