import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { SeedExplorer } from "@/components/seeds/seed-explorer";
import {
  getSeedsByStatus,
  getAllSeedsForMap,
  type SortOption,
} from "@/lib/db/queries/seeds";
import { statuses, slugToStatusKey } from "@/lib/statuses";

export async function generateStaticParams() {
  return Object.values(statuses).map((info) => ({ slug: info.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const statusKey = slugToStatusKey(slug);
  if (!statusKey) return {};
  const info = statuses[statusKey];
  return {
    title: info.pluralLabel,
    description: info.description,
  };
}

export default async function StatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    badges?: string;
    page?: string;
    sort?: string;
    search?: string;
  }>;
}) {
  const { slug } = await params;
  const statusKey = slugToStatusKey(slug);
  if (!statusKey) notFound();

  const info = statuses[statusKey];
  const Icon = info.icon;

  const sp = await searchParams;
  const session = await auth();
  const page = Number(sp.page) || 1;
  const search = sp.search || undefined;
  const badgesParam = sp.badges?.split(",").filter(Boolean) ?? [];
  const sortParam = sp.sort;
  const sort: SortOption =
    sortParam === "supported"
      ? "supported"
      : sortParam === "mine" && session?.user
        ? "mine"
        : "newest";

  const [seedResult, mapSeeds] = await Promise.all([
    getSeedsByStatus({
      status: statusKey,
      badges: badgesParam.length > 0 ? badgesParam : undefined,
      page,
      sort,
      userId: session?.user?.id,
      search,
    }),
    getAllSeedsForMap({
      status: statusKey,
      badges: badgesParam.length > 0 ? badgesParam : undefined,
      userId: session?.user?.id,
      search,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-1.5 size-3.5" />
            Back
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <Icon className={`size-8 ${info.textClass}`} />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {info.pluralLabel}
            </h1>
            <p className="text-muted-foreground mt-1">{info.description}</p>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="py-8 text-center">Loading...</div>}>
        <SeedExplorer
          seeds={seedResult.seeds}
          mapSeeds={mapSeeds}
          currentPage={seedResult.currentPage}
          totalPages={seedResult.totalPages}
          activeBadges={badgesParam}
          activeSort={sort}
          isSignedIn={!!session?.user}
          showCategoryFilter={false}
          showBadgeFilter={true}
        />
      </Suspense>
    </div>
  );
}
