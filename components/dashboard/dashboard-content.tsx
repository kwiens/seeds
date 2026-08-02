"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf, Sprout, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/seeds/category-badge";
import { DashboardSeedList } from "@/components/dashboard/seed-list-table";
import { SeedListView } from "@/components/seeds/seed-list-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CategoryKey } from "@/lib/categories";
import type { MyProject } from "@/lib/db/queries/my-projects";
import { projectStages } from "@/lib/project-stages";
import { formatRelativeTime } from "@/lib/format";

export type DashboardTab = "my-sprouts" | "my-seeds" | "supporting";

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

interface SupportedSeed {
  id: string;
  name: string;
  summary: string;
  category: CategoryKey;
  imageUrl: string | null;
  coverPhotoUrl: string | null;
  stage: "seed" | "sprout" | "tree";
  approvalState: "draft" | "pending" | "approved";
  supportCount: number;
}

export function DashboardContent({
  sprouts,
  userSeeds,
  supportedSeeds,
  initialTab,
}: {
  sprouts: MyProject[];
  userSeeds: DashboardSeed[];
  supportedSeeds: SupportedSeed[];
  initialTab?: DashboardTab;
}) {
  const hasActiveSeeds = userSeeds.some((seed) => !seed.archivedAt);
  const defaultTab: DashboardTab =
    initialTab ??
    (sprouts.length > 0
      ? "my-sprouts"
      : hasActiveSeeds
        ? "my-seeds"
        : "supporting");
  const [activeTab, setActiveTab] = useState<DashboardTab>(defaultTab);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as DashboardTab)}
    >
      <TabsList className="mb-6 grid h-auto w-full grid-cols-3 sm:w-fit">
        <TabsTrigger
          value="my-sprouts"
          className="gap-1.5"
          onClick={() => setActiveTab("my-sprouts")}
        >
          <Leaf className="size-4" />
          My Sprouts
        </TabsTrigger>
        <TabsTrigger
          value="my-seeds"
          className="gap-1.5"
          onClick={() => setActiveTab("my-seeds")}
        >
          <Sprout className="size-4" />
          My Seeds
        </TabsTrigger>
        <TabsTrigger
          value="supporting"
          className="gap-1.5"
          onClick={() => setActiveTab("supporting")}
        >
          <Sun className="size-4" />
          Supporting
        </TabsTrigger>
      </TabsList>

      <TabsContent value="my-sprouts">
        {sprouts.length === 0 ? (
          <div className="rounded-lg border border-dashed py-16 text-center">
            <p className="text-muted-foreground">
              No Sprouts yet — once one of your Seeds reaches the Sprout stage,
              its team workspace will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sprouts.map((sprout) => (
              <Link
                key={sprout.id}
                href={`/dashboard/projects/${sprout.id}`}
                className="hover:border-primary flex items-center gap-4 rounded-lg border p-4 transition-colors"
              >
                {sprout.unreadCount > 0 && (
                  <span className="bg-primary size-2 shrink-0 rounded-full" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{sprout.name}</p>
                  <div className="mt-1">
                    <CategoryBadge category={sprout.category} />
                    <span className="text-muted-foreground ml-2 text-xs">
                      {projectStages[sprout.stage].label}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {sprout.unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
                      {sprout.unreadCount} new
                    </span>
                  )}
                  <p className="text-muted-foreground text-xs">
                    Updated {formatRelativeTime(sprout.lastActivityAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="my-seeds">
        {userSeeds.length === 0 ? (
          <div className="rounded-lg border border-dashed py-16 text-center">
            <p className="text-muted-foreground mb-4 text-lg">
              You haven&apos;t planted any seeds yet.
            </p>
            <Button asChild>
              <Link href="/seeds/new">Plant Your First Seed</Link>
            </Button>
          </div>
        ) : (
          <DashboardSeedList seeds={userSeeds} />
        )}
      </TabsContent>

      <TabsContent value="supporting">
        {supportedSeeds.length === 0 ? (
          <div className="rounded-lg border border-dashed py-16 text-center">
            <p className="text-muted-foreground mb-4 text-lg">
              You haven&apos;t supported any seeds yet.
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              Explore seeds and tap support this seed to show your support.
            </p>
            <Button asChild>
              <Link href="/">Explore Seeds</Link>
            </Button>
          </div>
        ) : (
          <SeedListView seeds={supportedSeeds} />
        )}
      </TabsContent>
    </Tabs>
  );
}
