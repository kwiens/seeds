import { hasTeamWorkspace, type ProjectStage } from "@/lib/project-stages";

export { hasTeamWorkspace } from "@/lib/project-stages";

export type ProjectWorkspaceSection =
  | "edit"
  | "updates"
  | "supporters"
  | "team";

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

export function projectWorkspacePath(
  projectId: string,
  section?: ProjectWorkspaceSection,
): string {
  const base = `/dashboard/projects/${projectId}`;
  return section ? `${base}/${section}` : base;
}
