import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { BudgetEditor } from "@/components/projects/budget-editor";
import { MarkProjectActivityRead } from "@/components/projects/mark-project-activity-read";
import { ProjectDocuments } from "@/components/projects/project-documents";
import { TeamRoster } from "@/components/projects/team-roster";
import { TeamUpdatesSection } from "@/components/projects/team-updates-section";
import { UpcomingEvents } from "@/components/projects/upcoming-events";
import { getBudgets } from "@/lib/db/queries/budgets";
import { getProjectDocuments } from "@/lib/db/queries/documents";
import { getPendingInvites } from "@/lib/db/queries/invites";
import { getTeamMembers } from "@/lib/db/queries/team-roster";
import { getUpcomingEvents } from "@/lib/db/queries/team-events";
import { getTeamProjectUpdates } from "@/lib/db/queries/project-updates";
import { getProjectWorkspace } from "@/lib/project-workspace";
import { projectWorkspacePath } from "@/lib/project-workspace-navigation";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Team Workspace",
};

export default async function ProjectTeamPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const { session, project, canManage, canAccessTeam } =
    await getProjectWorkspace(id);

  // canAccessTeam already folds in the stage and archive gates.
  if (!canAccessTeam) {
    redirect(
      canManage
        ? projectWorkspacePath(project.id, "edit")
        : routes.project(project.id),
    );
  }

  // Mark only activity that existed when this render began. Using the time the
  // client effect eventually runs could hide an update that was never rendered.
  const readThrough = new Date().toISOString();
  const [
    teamUpdates,
    members,
    budgets,
    documents,
    upcomingEvents,
    pendingInvites,
  ] = await Promise.all([
    getTeamProjectUpdates(project.id),
    getTeamMembers(project.id),
    getBudgets(project.id),
    getProjectDocuments(project.id),
    getUpcomingEvents(project.id),
    getPendingInvites(project.id, {
      canManage,
      isAdmin: session.user.role === "admin",
    }),
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
      <MarkProjectActivityRead
        projectId={project.id}
        readThrough={readThrough}
      />
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Team workspace</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Private planning, files, events, budget, and team conversation.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.6fr_1fr]">
        <TeamUpdatesSection
          projectId={project.id}
          updates={teamUpdates}
          isAdmin={session.user.role === "admin"}
          rolesByUserId={rolesByUserId}
        />
        <div className="space-y-4">
          <UpcomingEvents
            projectId={project.id}
            events={upcomingEvents}
            canManage={canManage}
          />
          <TeamRoster
            projectId={project.id}
            members={members}
            pendingInvites={pendingInvites}
            canManage={canManage}
            isAdmin={session.user.role === "admin"}
          />
          <BudgetEditor
            projectId={project.id}
            projectName={project.name}
            proposed={budgets.proposed}
            final={budgets.final}
            canManage={canManage}
          />
          <ProjectDocuments projectId={project.id} documents={documents} />
        </div>
      </div>
    </section>
  );
}
