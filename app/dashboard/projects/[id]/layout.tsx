import Link from "next/link";
import { ArrowLeft, ExternalLink, Lock } from "lucide-react";
import { ProjectWorkspaceNav } from "@/components/dashboard/project-workspace-nav";
import { SeedStatusBadge } from "@/components/dashboard/seed-status-badge";
import { CategoryBadge } from "@/components/seeds/category-badge";
import { Button } from "@/components/ui/button";
import { getProjectWorkspace } from "@/lib/project-workspace";
import { hasTeamWorkspace } from "@/lib/project-workspace-navigation";

export default async function ProjectWorkspaceLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const { project, canManage, canAccessTeam } = await getProjectWorkspace(id);
  const teamToolsUnlocked =
    !project.archivedAt && hasTeamWorkspace(project.stage);
  const mineTab = canAccessTeam ? "my-sprouts" : "my-seeds";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href={`/dashboard?tab=${mineTab}`}>
          <ArrowLeft className="mr-1.5 size-3.5" />
          Back to Mine
        </Link>
      </Button>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <CategoryBadge category={project.category} />
            <SeedStatusBadge
              stage={project.stage}
              approvalState={project.approvalState}
              archivedAt={project.archivedAt}
            />
            <span className="text-muted-foreground inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium">
              <Lock className="size-3" />
              Private workspace
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {project.name}
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            {teamToolsUnlocked
              ? "Team planning is now the default. Editing, public updates, and supporters stay close at hand."
              : "Shape the project and keep supporters informed. Team planning tools unlock when this Seed becomes a Sprout."}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href={`/seeds/${project.id}`}>
            View public page
            <ExternalLink className="ml-1.5 size-3.5" />
          </Link>
        </Button>
      </div>

      <ProjectWorkspaceNav
        projectId={project.id}
        canManage={canManage}
        canAccessTeam={canAccessTeam}
      />

      <div className="pt-8">{children}</div>
    </div>
  );
}
