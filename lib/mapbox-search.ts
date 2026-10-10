import { siteConfig } from "@/config/site";

/**
 * Thin client for the Mapbox Search Box API, shared by the location picker
 * and the address autocomplete. Results are biased toward the configured city
 * center and restricted to its country.
 */

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export interface PlaceSuggestion {
  name: string;
  full_address: string;
  mapbox_id: string;
}

export interface ResolvedPlace {
  address: string;
  lat: number;
  lng: number;
}

export function newSearchSession() {
  return crypto.randomUUID();
}

export async function suggestPlaces(
  query: string,
  sessionToken: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  if (!MAPBOX_TOKEN) return [];
  const { center, searchLanguage } = siteConfig.map;
  const params = new URLSearchParams({
    q: query,
    access_token: MAPBOX_TOKEN,
    proximity: `${center.longitude},${center.latitude}`,
    country: siteConfig.city.country,
    limit: "5",
    language: searchLanguage,
    session_token: sessionToken,
  });
  const res = await fetch(
    `https://api.mapbox.com/search/searchbox/v1/suggest?${params}`,
    { signal },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.suggestions ?? []).filter(
    (s: PlaceSuggestion) => s.mapbox_id && (s.full_address || s.name),
  );
}

export async function retrievePlace(
  suggestion: PlaceSuggestion,
  sessionToken: string,
): Promise<ResolvedPlace | null> {
  if (!MAPBOX_TOKEN) return null;
  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    session_token: sessionToken,
  });
  const res = await fetch(
    `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}?${params}`,
  );
  if (!res.ok) return null;
  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature?.geometry?.coordinates) return null;
  const [lng, lat] = feature.geometry.coordinates;
  return {
    address:
      feature.properties?.full_address ||
      suggestion.full_address ||
      suggestion.name,
    lat,
    lng,
  };
}
