import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { auth } from "@/auth";
import { canAccessTeamUpdates } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/seeds/category-badge";
import { TeamUpdatesSection } from "@/components/seeds/team-updates-section";
import { getSeedById } from "@/lib/db/queries/seeds";
import { getTeamUpdatesBySeed } from "@/lib/db/queries/team-updates";

export default async function SproutTeamPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const seed = await getSeedById(params.id);
  if (!seed) notFound();

  if (seed.status !== "in_progress") notFound();

  if (!canAccessTeamUpdates(session, seed)) {
    redirect(`/seeds/${seed.id}`);
  }

  const teamUpdates = await getTeamUpdatesBySeed(seed.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href={`/seeds/${seed.id}`}>
          <ArrowLeft className="mr-1.5 size-3.5" />
          Back to {seed.name}
        </Link>
      </Button>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <CategoryBadge category={seed.category} />
        <span className="text-muted-foreground inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          <Lock className="size-3" />
          Private team workspace
        </span>
      </div>

      <h1 className="mb-1 text-2xl font-bold tracking-tight">{seed.name}</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        Visible only to this Sprout&apos;s team — not part of the public page.
      </p>

      <TeamUpdatesSection seedId={seed.id} updates={teamUpdates} />
    </div>
  );
}
