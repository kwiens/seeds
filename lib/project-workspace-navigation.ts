import { hasTeamWorkspace, type ProjectStage } from "@/lib/project-stages";
import { routes, type ProjectWorkspaceSection } from "@/lib/routes";

export type { ProjectWorkspaceSection } from "@/lib/routes";

interface ProjectWorkspaceAccess {
  stage: ProjectStage;
  canManage: boolean;
  canAccessTeam: boolean;
}

export function getDefaultProjectWorkspaceSection({
  stage,
  canManage,
  canAccessTeam,
}: ProjectWorkspaceAccess): ProjectWorkspaceSection | null {
  if (hasTeamWorkspace(stage) && canAccessTeam) return "team";
  if (canManage) return "edit";
  return null;
}

/** @deprecated Import `routes.workspace` from `@/lib/routes`. */
export const projectWorkspacePath = routes.workspace;
