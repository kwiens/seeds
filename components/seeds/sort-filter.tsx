"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Clock, Heart, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SortOption } from "@/lib/db/queries/seeds";

export function SortFilter({
  activeSort,
  isSignedIn,
}: {
  activeSort: SortOption;
  isSignedIn?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setSort(sort: SortOption) {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", sort);
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 rounded-lg border p-1">
      <Button
        variant={activeSort === "newest" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setSort("newest")}
        className="gap-1.5"
      >
        <Clock className="size-4" />
        <span className="hidden sm:inline">Newest</span>
      </Button>
      <Button
        variant={activeSort === "supported" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setSort("supported")}
        className="gap-1.5"
      >
        <Sun className="size-4" />
        <span className="hidden sm:inline">Supported</span>
      </Button>
      {isSignedIn && (
        <Button
          variant={activeSort === "mine" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setSort("mine")}
          className="gap-1.5"
        >
          <Heart className="size-4" />
          <span className="hidden sm:inline">Backing</span>
        </Button>
      )}
    </div>
  );
}
