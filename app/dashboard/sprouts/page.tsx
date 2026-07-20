import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { CategoryBadge } from "@/components/seeds/category-badge";
import { getMySprouts } from "@/lib/db/queries/sprouts";
import { formatRelativeTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "My Sprouts | Seeds",
};

export default async function MySproutsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const isAdmin = session.user.role === "admin";
  const sprouts = await getMySprouts(session.user.id, isAdmin);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Sprouts</h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin
            ? "Every active Sprout across the platform."
            : "Sprouts you're growing."}
        </p>
      </div>

      {sprouts.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="text-muted-foreground">
            No Sprouts yet — once one of your Seeds is advanced to a Sprout,
            it&apos;ll show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sprouts.map((sprout) => (
            <Link
              key={sprout.id}
              href={`/seeds/${sprout.id}/team`}
              className="hover:border-primary flex items-center gap-4 rounded-lg border p-4 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{sprout.name}</p>
                <div className="mt-1">
                  <CategoryBadge category={sprout.category} />
                </div>
              </div>
              <p className="text-muted-foreground shrink-0 text-xs">
                Updated {formatRelativeTime(sprout.updatedAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
