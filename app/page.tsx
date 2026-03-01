import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import type { CategoryKey } from "@/lib/categories";
import {
  getApprovedSeeds,
  getAllSeedsForMap,
  type SortOption,
} from "@/lib/db/queries/seeds";
import { HomeContent } from "./home-content";

export default async function HomePage(props: {
  searchParams: Promise<{ category?: string; page?: string; sort?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  const category = searchParams.category as CategoryKey | undefined;
  const page = Number(searchParams.page) || 1;
  const sort = (
    searchParams.sort === "supported" ? "supported" : "newest"
  ) as SortOption;

  const [seedResult, mapSeeds] = await Promise.all([
    getApprovedSeeds({ category, page, sort, userId: session?.user?.id }),
    getAllSeedsForMap({ category, userId: session?.user?.id }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Explore Seeds</h1>
          <p className="text-muted-foreground mt-1">
            Discover community ideas growing across our region
          </p>
        </div>
        <Button asChild>
          <Link href="/seeds/new" className="gap-1.5">
            <Plus className="size-4" />
            Plant a Seed
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div className="py-8 text-center">Loading...</div>}>
        <HomeContent
          seeds={seedResult.seeds}
          mapSeeds={mapSeeds}
          currentPage={seedResult.currentPage}
          totalPages={seedResult.totalPages}
          activeCategory={category}
          activeSort={sort}
        />
      </Suspense>
    </div>
  );
}
