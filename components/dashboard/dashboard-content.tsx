"use client";

import { useState } from "react";
import Link from "next/link";
import { Sprout, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardSeedList } from "@/components/dashboard/seed-list-table";
import { SeedListView } from "@/components/seeds/seed-list-view";
import type { CategoryKey } from "@/lib/categories";

type DashboardTab = "supporting" | "my-seeds";

interface DashboardSeed {
  id: string;
  name: string;
  category: CategoryKey;
  status: string;
  supportCount: number;
  createdAt: Date;
}

interface SupportedSeed {
  id: string;
  name: string;
  summary: string;
  category: CategoryKey;
  imageUrl: string | null;
  supportCount: number;
}

export function DashboardContent({
  userSeeds,
  supportedSeeds,
}: {
  userSeeds: DashboardSeed[];
  supportedSeeds: SupportedSeed[];
}) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("supporting");

  return (
    <>
      <div className="mb-6 flex w-fit gap-1 self-start rounded-lg border p-1">
        <Button
          variant={activeTab === "supporting" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("supporting")}
          className="gap-1.5"
        >
          <Sun className="size-4" />
          Supporting
        </Button>
        <Button
          variant={activeTab === "my-seeds" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("my-seeds")}
          className="gap-1.5"
        >
          <Sprout className="size-4" />
          My Seeds
        </Button>
      </div>

      {activeTab === "supporting" ? (
        supportedSeeds.length === 0 ? (
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
        )
      ) : userSeeds.length === 0 ? (
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
    </>
  );
}
