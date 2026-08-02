import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { canAccessTeamWorkspace, canManageProject } from "@/lib/auth-utils";
import { getProjectById } from "@/lib/db/queries/projects";
import {
  hasTeamWorkspace,
  projectWorkspacePath,
} from "@/lib/project-workspace-navigation";

/**
 * The workspace's data boundary. Keeping authorization and the project lookup
 * here prevents route sections from duplicating model and access details.
 */
export const getProjectWorkspace = cache(async (projectId: string) => {
  const session = await auth();
  if (!session?.user?.id) {
    const callbackUrl = encodeURIComponent(projectWorkspacePath(projectId));
    redirect(`/api/auth/signin?callbackUrl=${callbackUrl}`);
  }

  const project = await getProjectById(projectId);
  if (!project) notFound();

  const teamWorkspaceAvailable =
    !project.archivedAt && hasTeamWorkspace(project.stage);
  const [canManage, canAccessTeam] = await Promise.all([
    canManageProject(session, project),
    teamWorkspaceAvailable ? canAccessTeamWorkspace(session, project) : false,
  ]);

  if (!canManage && !canAccessTeam) {
    redirect(`/seeds/${project.id}`);
  }

  return {
    session,
    project,
    canManage,
    canAccessTeam,
  };
});

export async function getManagedProjectWorkspace(projectId: string) {
  const workspace = await getProjectWorkspace(projectId);
  if (!workspace.canManage) {
    redirect(
      workspace.canAccessTeam
        ? projectWorkspacePath(workspace.project.id, "team")
        : `/seeds/${workspace.project.id}`,
    );
  }
  return workspace;
}
