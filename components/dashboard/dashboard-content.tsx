"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sprout, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardSeedList } from "@/components/dashboard/seed-list-table";
import { SeedListView } from "@/components/seeds/seed-list-view";
import type { CategoryKey } from "@/lib/categories";

type DashboardTab = "my-seeds" | "supporting";

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
  activeTab = "my-seeds",
}: {
  userSeeds: DashboardSeed[];
  supportedSeeds: SupportedSeed[];
  activeTab?: DashboardTab;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setTab(tab: DashboardTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "my-seeds") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <>
      <div className="mb-6 flex gap-1 rounded-lg border p-1 self-start w-fit">
        <Button
          variant={activeTab === "my-seeds" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setTab("my-seeds")}
          className="gap-1.5"
        >
          <Sprout className="size-4" />
          My Seeds
        </Button>
        <Button
          variant={activeTab === "supporting" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setTab("supporting")}
          className="gap-1.5"
        >
          <Sun className="size-4" />
          Supporting
        </Button>
      </div>

      {activeTab === "my-seeds" ? (
        userSeeds.length === 0 ? (
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
        )
      ) : supportedSeeds.length === 0 ? (
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
    </>
  );
}
