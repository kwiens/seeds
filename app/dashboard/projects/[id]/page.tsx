import { redirect } from "next/navigation";
import { getProjectWorkspace } from "@/lib/project-workspace";
import {
  getDefaultProjectWorkspaceSection,
  projectWorkspacePath,
} from "@/lib/project-workspace-navigation";

export default async function ProjectWorkspacePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const { project, canManage, canAccessTeam } = await getProjectWorkspace(id);
  const section = getDefaultProjectWorkspaceSection({
    stage: project.stage,
    canManage,
    canAccessTeam,
  });

  if (!section) redirect(`/seeds/${project.id}`);
  redirect(projectWorkspacePath(project.id, section));
}
