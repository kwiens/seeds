import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { auth } from "@/auth";
import { canAccessTeamUpdates, canEditSeed } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { BudgetEditor } from "@/components/seeds/budget-editor";
import { CategoryBadge } from "@/components/seeds/category-badge";
import { MarkSproutRead } from "@/components/seeds/mark-sprout-read";
import { SeedDocuments } from "@/components/seeds/seed-documents";
import { TeamRoster } from "@/components/seeds/team-roster";
import { TeamUpdatesSection } from "@/components/seeds/team-updates-section";
import { UpcomingEvents } from "@/components/seeds/upcoming-events";
import { getBudgets } from "@/lib/db/queries/budgets";
import { getSeedDocuments } from "@/lib/db/queries/documents";
import { getSeedById } from "@/lib/db/queries/seeds";
import { getTeamMembers } from "@/lib/db/queries/team-roster";
import { getUpcomingEvents } from "@/lib/db/queries/team-events";
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

  if (!(await canAccessTeamUpdates(session, seed))) {
    redirect(`/seeds/${seed.id}`);
  }

  // Mark only activity that existed when this render began. Using the time the
  // client effect eventually runs could hide an update that was never rendered.
  const readThrough = new Date().toISOString();
  const [teamUpdates, members, budgets, documents, upcomingEvents] =
    await Promise.all([
      getTeamUpdatesBySeed(seed.id),
      getTeamMembers(seed.id),
      getBudgets(seed.id),
      getSeedDocuments(seed.id),
      getUpcomingEvents(seed.id),
    ]);

  const rolesByUserId: Record<string, string> = Object.fromEntries(
    members.map((m) => [m.userId, m.roleLabel]),
  );
  // Council members can post here without being on the roster -- label them
  // by their site-wide role instead of leaving their name unbadged.
  for (const update of teamUpdates) {
    if (!rolesByUserId[update.userId] && update.userRole === "council") {
      rolesByUserId[update.userId] = "Council";
    }
    for (const reply of update.replies) {
      if (!rolesByUserId[reply.userId] && reply.userRole === "council") {
        rolesByUserId[reply.userId] = "Council";
      }
    }
  }

  const isAdmin = session.user.role === "admin";
  const canManage = canEditSeed(session, seed);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <MarkSproutRead seedId={seed.id} readThrough={readThrough} />
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

      <div className="grid gap-6 md:grid-cols-[1.6fr_1fr]">
        <TeamUpdatesSection
          seedId={seed.id}
          updates={teamUpdates}
          isAdmin={isAdmin}
          rolesByUserId={rolesByUserId}
        />
        <div className="space-y-4">
          <UpcomingEvents
            seedId={seed.id}
            events={upcomingEvents}
            canManage={canManage}
          />
          <TeamRoster
            seedId={seed.id}
            members={members}
            canManage={canManage}
            isAdmin={isAdmin}
          />
          <BudgetEditor
            seedId={seed.id}
            seedName={seed.name}
            proposed={budgets.proposed}
            final={budgets.final}
            canManage={canManage}
          />
          <SeedDocuments seedId={seed.id} documents={documents} />
        </div>
      </div>
    </div>
  );
}
