"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface Suggestion {
  name: string;
  full_address: string;
  mapbox_id: string;
}

function generateSessionToken() {
  return crypto.randomUUID();
}

function isUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  maxLength,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sessionToken = useRef(generateSessionToken());
  const requestController = useRef<AbortController | null>(null);

  useEffect(() => () => requestController.current?.abort(), []);

  const searchAddress = useCallback(async (query: string) => {
    requestController.current?.abort();
    if (query.length < 3 || !MAPBOX_TOKEN || isUrl(query)) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const controller = new AbortController();
    requestController.current = controller;
    try {
      const res = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${MAPBOX_TOKEN}&proximity=-85.3097,35.0456&limit=5&language=en&session_token=${sessionToken.current}`,
        { signal: controller.signal },
      );
      if (requestController.current !== controller) return;
      if (!res.ok) {
        setSuggestions([]);
        return;
      }
      const data = await res.json();
      if (requestController.current !== controller) return;
      const items = (data.suggestions ?? []).filter(
        (s: Suggestion) => s.mapbox_id && (s.full_address || s.name),
      );
      setSuggestions(items);
      setShowSuggestions(true);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setSuggestions([]);
    }
  }, []);

  function selectSuggestion(suggestion: Suggestion) {
    onChange(suggestion.full_address || suggestion.name);
    setSuggestions([]);
    setShowSuggestions(false);
    sessionToken.current = generateSessionToken();
  }

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setShowSuggestions(false);
        }
      }}
    >
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          searchAddress(e.target.value);
        }}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="bg-popover absolute z-50 mt-1 w-full rounded-md border shadow-lg">
          {suggestions.map((suggestion) => (
            <li key={suggestion.mapbox_id}>
              <button
                type="button"
                className="hover:bg-accent w-full px-3 py-2 text-left text-sm"
                onClick={() => selectSuggestion(suggestion)}
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
  );
}
