import Link from "next/link";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { DashboardSeedList } from "@/components/dashboard/seed-list-table";
import type { CategoryKey } from "@/lib/categories";
import { getSeedsByUser } from "@/lib/db/queries/seeds";

export const metadata: Metadata = {
  title: "My Seeds | Seeds",
};

export default async function DashboardPage() {
  const session = await auth();
  const userSeeds = await getSeedsByUser(session!.user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Seeds</h1>
          <p className="text-muted-foreground mt-1">
            Manage your community project proposals
          </p>
        </div>
        <Button asChild>
          <Link href="/seeds/new" className="gap-1.5">
            <Plus className="size-4" />
            Plant a Seed
          </Link>
        </Button>
      </div>

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
        <DashboardSeedList
          seeds={userSeeds.map((s) => ({
            ...s,
            category: s.category as CategoryKey,
          }))}
        />
      )}
    </div>
  );
}
