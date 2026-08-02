"use client";

import Link from "next/link";
import { Settings2, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/seeds/category-badge";
import { SeedStatusBadge } from "@/components/dashboard/seed-status-badge";
import type { CategoryKey } from "@/lib/categories";

interface DashboardSeed {
  id: string;
  name: string;
  category: CategoryKey;
  stage: "seed" | "sprout" | "tree";
  approvalState: "draft" | "pending" | "approved";
  archivedAt: Date | null;
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
              <SeedStatusBadge
                stage={seed.stage}
                approvalState={seed.approvalState}
                archivedAt={seed.archivedAt}
              />
            </div>
            <div className="flex items-center gap-3">
              <CategoryBadge category={seed.category} />
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Sun className="size-3.5 text-amber-500" />
                {seed.supportCount}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/projects/${seed.id}`}>
              <Settings2 className="mr-1.5 size-3.5" />
              Manage
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
