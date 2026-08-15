"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const SEARCH_DEBOUNCE_MS = 250;

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
  id?: string;
  "aria-label"?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  maxLength,
  id,
  "aria-label": ariaLabel,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listId = useId();
  const sessionToken = useRef(generateSessionToken());
  const requestController = useRef<AbortController | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      requestController.current?.abort();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    },
    [],
  );

  const searchAddress = useCallback(async (query: string) => {
    requestController.current?.abort();
    if (query.length < 3 || !MAPBOX_TOKEN || isUrl(query)) {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveIndex(-1);
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
      setActiveIndex(-1);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setSuggestions([]);
    }
  }, []);

  function handleInputChange(next: string) {
    onChange(next);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(
      () => searchAddress(next),
      SEARCH_DEBOUNCE_MS,
    );
  }

  function selectSuggestion(suggestion: Suggestion) {
    onChange(suggestion.full_address || suggestion.name);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
    sessionToken.current = generateSessionToken();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
      return;
    }
    if (!showSuggestions || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    }
  }

  const isOpen = showSuggestions && suggestions.length > 0;

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setShowSuggestions(false);
          setActiveIndex(-1);
        }
      }}
    >
      <Input
        id={id}
        value={value}
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
        }
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
      <span aria-live="polite" className="sr-only">
        {isOpen
          ? `${suggestions.length} address suggestion${suggestions.length === 1 ? "" : "s"} available`
          : ""}
      </span>
      {isOpen && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Address suggestions"
          className="bg-popover absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.mapbox_id}
              id={`${listId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                "hover:bg-accent w-full cursor-pointer px-3 py-2 text-left text-sm",
                index === activeIndex && "bg-accent",
              )}
              // Select on pointer-down (before the input's blur closes the
              // list); Safari/Firefox never focus the option so click alone
              // can race the container's onBlur.
              onPointerDown={(event) => {
                event.preventDefault();
                selectSuggestion(suggestion);
              }}
            >
              <span className="font-medium">{suggestion.name}</span>
              {suggestion.full_address && (
                <span className="text-muted-foreground">
                  {" "}
                  — {suggestion.full_address}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
