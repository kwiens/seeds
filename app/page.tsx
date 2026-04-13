import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import type { CategoryKey } from "@/lib/categories";
import {
  getApprovedSeeds,
  getAllSeedsForMap,
  getSeedPreviewsByStatus,
  type SortOption,
} from "@/lib/db/queries/seeds";
import { getHomepagePhase } from "@/lib/db/queries/settings";
import { HomeContent } from "./home-content";
import { HomePhase2 } from "./home-phase2";

export default async function HomePage(props: {
  searchParams: Promise<{
    category?: string;
    page?: string;
    sort?: string;
    search?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  const phase = await getHomepagePhase();

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Explore Seeds</h1>
          <p className="text-muted-foreground mt-1">
            Seeds are place-based, actionable projects that require
            collaboration from many groups.
          </p>
          <p className="text-muted-foreground mt-1">
            Support your favorite seeds to get connected and help us grow the
            best place in the world to live.
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
        {phase === 2 ? (
          <Phase2Content userId={session?.user?.id} />
        ) : (
          <Phase1Content
            searchParams={searchParams}
            userId={session?.user?.id}
            isSignedIn={!!session?.user}
          />
        )}
      </Suspense>
    </div>
  );
}

async function Phase1Content({
  searchParams,
  userId,
  isSignedIn,
}: {
  searchParams: {
    category?: string;
    page?: string;
    sort?: string;
    search?: string;
  };
  userId?: string;
  isSignedIn: boolean;
}) {
  const category = searchParams.category as CategoryKey | undefined;
  const page = Number(searchParams.page) || 1;
  const sortParam = searchParams.sort;
  const search = searchParams.search || undefined;
  const sort: SortOption =
    sortParam === "supported"
      ? "supported"
      : sortParam === "mine" && userId
        ? "mine"
        : "newest";

  const [seedResult, mapSeeds] = await Promise.all([
    getApprovedSeeds({
      category,
      page,
      sort,
      userId,
      search,
    }),
    getAllSeedsForMap({ category, userId, search }),
  ]);

  return (
    <HomeContent
      seeds={seedResult.seeds}
      mapSeeds={mapSeeds}
      currentPage={seedResult.currentPage}
      totalPages={seedResult.totalPages}
      activeCategory={category}
      activeSort={sort}
      isSignedIn={isSignedIn}
    />
  );
}

async function Phase2Content({ userId }: { userId?: string }) {
  const previews = await getSeedPreviewsByStatus({ userId });

  return <HomePhase2 previews={previews} />;
}
