"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { categories, categoryKeys, type CategoryKey } from "@/lib/categories";

export function CategoryFilter({
  activeCategory,
}: {
  activeCategory?: CategoryKey;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setCategory(category?: CategoryKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <Button
        variant={!activeCategory ? "secondary" : "ghost"}
        size="sm"
        onClick={() => setCategory(undefined)}
        className="shrink-0"
      >
        All
      </Button>
      {categoryKeys.map((key) => {
        const info = categories[key];
        const Icon = info.icon;
        return (
          <Button
            key={key}
            variant={activeCategory === key ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setCategory(key)}
            className="shrink-0 gap-1.5"
          >
            <Icon className="size-3.5" />
            {info.label}
          </Button>
        );
      })}
    </div>
  );
}
