"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Map, {
  Marker,
  NavigationControl,
  Popup,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Sprout } from "lucide-react";
import { categories, type CategoryKey } from "@/lib/categories";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Chattanooga, TN
const DEFAULT_CENTER = { latitude: 35.0456, longitude: -85.3097 };
const DEFAULT_ZOOM = 12;

interface MapSeed {
  id: string;
  name: string;
  category: CategoryKey;
  locationLat: number | null;
  locationLng: number | null;
}

interface SeedMapProps {
  seeds?: MapSeed[];
  center?: { latitude: number; longitude: number };
  zoom?: number;
  singleMarker?: { lat: number; lng: number };
  className?: string;
  interactive?: boolean;
  onMarkerClick?: (seedId: string) => void;
}

export function SeedMap({
  seeds = [],
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  singleMarker,
  className = "h-96 w-full rounded-lg",
  interactive = true,
  onMarkerClick,
}: SeedMapProps) {
  const [popupSeed, setPopupSeed] = useState<MapSeed | null>(null);

  const handleMarkerClick = useCallback(
    (seed: MapSeed) => {
      if (onMarkerClick) {
        onMarkerClick(seed.id);
      } else {
        setPopupSeed(seed);
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
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        interactive={interactive}
      >
        <NavigationControl position="top-right" />

        {singleMarker && (
          <Marker latitude={singleMarker.lat} longitude={singleMarker.lng}>
            <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Sprout className="size-4" />
            </div>
          </Marker>
        )}

        {seeds.map((seed) => {
          if (!seed.locationLat || !seed.locationLng) return null;
          const info = categories[seed.category];
          return (
            <Marker
              key={seed.id}
              latitude={seed.locationLat}
              longitude={seed.locationLng}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(seed);
              }}
            >
              <div
                className={`flex size-8 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br shadow-lg transition-transform hover:scale-110 ${info.gradient}`}
              >
                <Sprout className="size-4 text-white" />
              </div>
            </Marker>
          );
        })}

        {popupSeed && popupSeed.locationLat && popupSeed.locationLng && (
          <Popup
            latitude={popupSeed.locationLat}
            longitude={popupSeed.locationLng}
            onClose={() => setPopupSeed(null)}
            closeButton
            closeOnClick={false}
          >
            <Link
              href={`/seeds/${popupSeed.id}`}
              className="block p-1 no-underline"
            >
              <p className="text-sm font-medium">{popupSeed.name}</p>
              <p className="text-muted-foreground text-xs">
                {categories[popupSeed.category].label}
              </p>
            </Link>
          </Popup>
        )}
      </Map>
    </div>
  );
}
