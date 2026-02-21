"use client";

import Link from "next/link";
import { Pencil, Sun, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/seeds/category-badge";
import { SeedStatusBadge } from "@/components/dashboard/seed-status-badge";
import type { CategoryKey } from "@/lib/categories";

interface DashboardSeed {
  id: string;
  name: string;
  category: CategoryKey;
  status: string;
  supportCount: number;
  createdAt: Date;
}

export function DashboardSeedList({ seeds }: { seeds: DashboardSeed[] }) {
  return (
    <div className="space-y-3">
      {seeds.map((seed) => (
        <div
          key={seed.id}
          className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/seeds/${seed.id}`}
                className="font-medium hover:underline"
              >
                {seed.name}
              </Link>
              <SeedStatusBadge status={seed.status} />
            </div>
            <div className="flex items-center gap-3">
              <CategoryBadge category={seed.category} />
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Sun className="size-3.5 text-amber-500" />
                {seed.supportCount}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/seeds/${seed.id}`}>
                <Eye className="mr-1.5 size-3.5" />
                Supporters
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/seeds/${seed.id}/edit`}>
                <Pencil className="mr-1.5 size-3.5" />
                Edit
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
