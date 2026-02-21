"use client";

import { useCallback, useState } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SeedMap } from "@/components/map/seed-map";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface LocationPickerProps {
  address: string;
  lat: number | null;
  lng: number | null;
  onLocationChange: (location: {
    address: string;
    lat: number;
    lng: number;
  }) => void;
}

interface GeocodingFeature {
  place_name: string;
  center: [number, number];
}

export function LocationPicker({
  address,
  lat,
  lng,
  onLocationChange,
}: LocationPickerProps) {
  const [query, setQuery] = useState(address);
  const [suggestions, setSuggestions] = useState<GeocodingFeature[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchAddress = useCallback(async (value: string) => {
    if (value.length < 3 || !MAPBOX_TOKEN) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${MAPBOX_TOKEN}&proximity=-85.3097,35.0456&limit=5`,
      );
      if (!res.ok) {
        setSuggestions([]);
        return;
      }
      const data = await res.json();
      const features = (data.features ?? []).filter(
        (f: GeocodingFeature) =>
          f.place_name && Array.isArray(f.center) && f.center.length === 2,
      );
      setSuggestions(features);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  }, []);

  function selectSuggestion(feature: GeocodingFeature) {
    if (!feature.center || feature.center.length < 2) return;
    const [lngVal, latVal] = feature.center;
    setQuery(feature.place_name);
    setSuggestions([]);
    setShowSuggestions(false);
    onLocationChange({
      address: feature.place_name,
      lat: latVal,
      lng: lngVal,
    });
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        <MapPin className="mr-1 inline size-4" />
        Soil (Location)
      </label>
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            searchAddress(e.target.value);
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Search for an address in Chattanooga..."
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
            {suggestions.map((feature, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                  onMouseDown={() => selectSuggestion(feature)}
                >
                  {feature.place_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {lat && lng && (
        <div className="mt-3">
          <SeedMap
            key={`${lat},${lng}`}
            singleMarker={{ lat, lng }}
            zoom={14}
            className="h-48 w-full rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
