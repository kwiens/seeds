"use client";

import { useCallback, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { SeedIcon } from "@/components/icons/seed-icons";
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

interface Suggestion {
  name: string;
  full_address: string;
  mapbox_id: string;
}

function generateSessionToken() {
  return crypto.randomUUID();
}

export function LocationPicker({
  address,
  lat,
  lng,
  onLocationChange,
}: LocationPickerProps) {
  const [query, setQuery] = useState(address);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sessionToken = useRef(generateSessionToken());

  const searchAddress = useCallback(async (value: string) => {
    if (value.length < 3 || !MAPBOX_TOKEN) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(value)}&access_token=${MAPBOX_TOKEN}&proximity=-85.3097,35.0456&limit=5&language=en&session_token=${sessionToken.current}`,
      );
      if (!res.ok) {
        setSuggestions([]);
        return;
      }
      const data = await res.json();
      const items = (data.suggestions ?? []).filter(
        (s: Suggestion) => s.mapbox_id && (s.full_address || s.name),
      );
      setSuggestions(items);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  }, []);

  async function selectSuggestion(suggestion: Suggestion) {
    if (!MAPBOX_TOKEN) return;

    setSuggestions([]);
    setShowSuggestions(false);

    const displayName = suggestion.full_address || suggestion.name;
    setQuery(displayName);

    try {
      const res = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}?access_token=${MAPBOX_TOKEN}&session_token=${sessionToken.current}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      const feature = data.features?.[0];
      if (!feature?.geometry?.coordinates) return;

      const [lngVal, latVal] = feature.geometry.coordinates;
      onLocationChange({
        address: feature.properties?.full_address || displayName,
        lat: latVal,
        lng: lngVal,
      });
    } catch {
      // Suggestion was already selected visually, coordinates just won't update
    }

    // Start a new session for the next search
    sessionToken.current = generateSessionToken();
  }

  return (
    <div>
      <span className="mb-2 flex items-center gap-2 text-sm font-medium">
        <SeedIcon name="soil" />
        Soil (Location)
      </span>
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            searchAddress(e.target.value);
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Search for a place or address..."
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
            {suggestions.map((suggestion) => (
              <li key={suggestion.mapbox_id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                  onMouseDown={() => selectSuggestion(suggestion)}
                >
                  <span className="font-medium">{suggestion.name}</span>
                  {suggestion.full_address && (
                    <span className="text-muted-foreground">
                      {" "}
                      — {suggestion.full_address}
                    </span>
                  )}
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
