import { cache } from "react";
import { auth } from "@/auth";
import { canManageProject } from "@/lib/auth-utils";
import { getProjectById } from "@/lib/db/queries/projects";
import { getPublicProjectUpdateById } from "@/lib/db/queries/project-updates";

// Pages and metadata must resolve the same authorized data. A page's
// notFound() does not prevent its metadata from being included in a response.
export const getReadableProject = cache(async (projectId: string) => {
  const session = await auth();
  const project = await getProjectById(projectId);
  if (!project) return null;

  const canManage = await canManageProject(session, project);
  if ((project.approvalState === "draft" || project.archivedAt) && !canManage) {
    return null;
  }

  // Pending projects remain public so organizers can share them for feedback.
  return { project, session, canManage };
});

export const getReadableProjectUpdate = cache(
  async (projectId: string, updateId: string) => {
    const access = await getReadableProject(projectId);
    if (!access) return null;

    const update = await getPublicProjectUpdateById(updateId);
    if (!update || update.projectId !== access.project.id) return null;
    return { ...access, update };
  },
);
