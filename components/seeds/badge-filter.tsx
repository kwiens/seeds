"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { badges, badgeKeys, type BadgeKey } from "@/lib/badges";

export function BadgeFilter({ activeBadges }: { activeBadges: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function toggleBadge(badge: BadgeKey) {
    const params = new URLSearchParams(searchParams.toString());
    const current = new Set(activeBadges);

    if (current.has(badge)) {
      current.delete(badge);
    } else {
      current.add(badge);
    }

    if (current.size > 0) {
      params.set("badges", Array.from(current).join(","));
    } else {
      params.delete("badges");
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  function clearBadges() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("badges");
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <Button
        variant={activeBadges.length === 0 ? "secondary" : "ghost"}
        size="sm"
        onClick={clearBadges}
        className="shrink-0"
      >
        All
      </Button>
      {badgeKeys.map((key) => {
        const info = badges[key];
        const Icon = info.icon;
        const isActive = activeBadges.includes(key);
        return (
          <Button
            key={key}
            variant={isActive ? "secondary" : "ghost"}
            size="sm"
            onClick={() => toggleBadge(key)}
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
