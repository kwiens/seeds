"use client";

import { useCallback, useRef, useState } from "react";
import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SeedIcon } from "@/components/icons/seed-icons";
import { ProjectMap } from "@/components/map/project-map";
import { siteConfig } from "@/config/site";
import {
  newSearchSession,
  type PlaceSuggestion,
  retrievePlace,
  suggestPlaces,
} from "@/lib/mapbox-search";

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

export function LocationPicker({
  address,
  lat,
  lng,
  onLocationChange,
}: LocationPickerProps) {
  const [query, setQuery] = useState(address);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sessionToken = useRef(newSearchSession());

  const searchAddress = useCallback(async (value: string) => {
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const items = await suggestPlaces(value, sessionToken.current);
      setSuggestions(items);
      setShowSuggestions(items.length > 0);
    } catch {
      setSuggestions([]);
    }
  }, []);

  async function selectSuggestion(suggestion: PlaceSuggestion) {
    setSuggestions([]);
    setShowSuggestions(false);
    setQuery(suggestion.full_address || suggestion.name);

    try {
      const place = await retrievePlace(suggestion, sessionToken.current);
      if (place) onLocationChange(place);
    } catch {
      // Suggestion was already selected visually, coordinates just won't update
    }

    // Start a new session for the next search
    sessionToken.current = newSearchSession();
  }

  return (
    <div>
      <span className="mb-2 flex items-center gap-2 text-sm font-medium">
        <SeedIcon name="soil" />
        Soil (The community this is for)
        <a
          href="/about#seed-soil"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground"
          title="Learn more"
        >
          <Info className="size-3.5" />
        </a>
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
          placeholder="Search for places or a nearby address"
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
          <ProjectMap
            key={`${lat},${lng}`}
            singleMarker={{ lat, lng }}
            zoom={siteConfig.map.pickerZoom}
            className="h-48 w-full rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
