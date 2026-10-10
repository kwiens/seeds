"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchInput({
  ariaLabel = "Search seeds",
  fixedParams,
  placeholder = "Search seeds...",
}: {
  ariaLabel?: string;
  fixedParams?: Record<string, string>;
  placeholder?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("search") ?? "");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fixedParamsString = new URLSearchParams(fixedParams).toString();

  useEffect(() => {
    const currentSearch = searchParams.get("search") ?? "";
    if (value === currentSearch) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      for (const [key, fixedValue] of new URLSearchParams(fixedParamsString)) {
        params.set(key, fixedValue);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    }, 300);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [fixedParamsString, value, searchParams, router]);

  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
      <Input
        type="text"
        name="search"
        placeholder={placeholder}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9 pr-9"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          className="text-muted-foreground hover:text-foreground absolute right-1 top-1/2 -translate-y-1/2 p-2"
        >
          <X className="size-4" />
          <span className="sr-only">Clear search</span>
        </button>
      )}
    </div>
  );
}
