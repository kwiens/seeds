import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { BudgetEditor } from "@/components/seeds/budget-editor";
import { MarkSproutRead } from "@/components/seeds/mark-sprout-read";
import { SeedDocuments } from "@/components/seeds/seed-documents";
import { TeamRoster } from "@/components/seeds/team-roster";
import { TeamUpdatesSection } from "@/components/seeds/team-updates-section";
import { UpcomingEvents } from "@/components/seeds/upcoming-events";
import { getBudgets } from "@/lib/db/queries/budgets";
import { getProjectDocuments } from "@/lib/db/queries/documents";
import { getTeamMembers } from "@/lib/db/queries/team-roster";
import { getUpcomingEvents } from "@/lib/db/queries/team-events";
import { getTeamProjectUpdates } from "@/lib/db/queries/project-updates";
import { getProjectWorkspace } from "@/lib/project-workspace";
import {
  hasTeamWorkspace,
  projectWorkspacePath,
} from "@/lib/project-workspace-navigation";

export const metadata: Metadata = {
  title: "Team Workspace | Seeds",
};

export default async function ProjectTeamPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const { session, project, canManage, canAccessTeam } =
    await getProjectWorkspace(id);

  if (!hasTeamWorkspace(project.stage) || !canAccessTeam) {
    redirect(
      canManage
        ? projectWorkspacePath(project.id, "edit")
        : `/seeds/${project.id}`,
    );
  }

  // Mark only activity that existed when this render began. Using the time the
  // client effect eventually runs could hide an update that was never rendered.
  const readThrough = new Date().toISOString();
  const [teamUpdates, members, budgets, documents, upcomingEvents] =
    await Promise.all([
      getTeamProjectUpdates(project.id),
      getTeamMembers(project.id),
      getBudgets(project.id),
      getProjectDocuments(project.id),
      getUpcomingEvents(project.id),
    ]);

  const rolesByUserId: Record<string, string> = Object.fromEntries(
    members.map((member) => [member.userId, member.roleLabels.join(", ")]),
  );
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

  return (
    <section>
      <MarkSproutRead seedId={project.id} readThrough={readThrough} />
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Team workspace</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Private planning, files, events, budget, and team conversation.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.6fr_1fr]">
        <TeamUpdatesSection
          seedId={project.id}
          updates={teamUpdates}
          isAdmin={session.user.role === "admin"}
          rolesByUserId={rolesByUserId}
        />
        <div className="space-y-4">
          <UpcomingEvents
            seedId={project.id}
            events={upcomingEvents}
            canManage={canManage}
          />
          <TeamRoster
            seedId={project.id}
            members={members}
            canManage={canManage}
            isAdmin={session.user.role === "admin"}
          />
          <BudgetEditor
            seedId={project.id}
            seedName={project.name}
            proposed={budgets.proposed}
            final={budgets.final}
            canManage={canManage}
          />
          <SeedDocuments seedId={project.id} documents={documents} />
        </div>
      </div>
    </section>
  );
}
