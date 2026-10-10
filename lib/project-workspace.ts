import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProjectById } from "@/lib/db/queries/projects";
import { getProjectAccess } from "@/lib/project-access";
import { routes } from "@/lib/routes";

/**
 * The workspace's data boundary. Keeping authorization and the project lookup
 * here prevents route sections from duplicating model and access details.
 */
export const getProjectWorkspace = cache(async (projectId: string) => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(routes.signInWithCallback(routes.workspace(projectId)));
  }

  const project = await getProjectById(projectId);
  if (!project) notFound();

  const { canManage, canAccessTeam } = await getProjectAccess(session, project);

  if (!canManage && !canAccessTeam) {
    redirect(routes.project(project.id));
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
        ? routes.workspace(workspace.project.id, "team")
        : routes.project(workspace.project.id),
    );
  }
  return workspace;
}
