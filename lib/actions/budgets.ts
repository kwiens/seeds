"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { canManageProject } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { projectBudgets } from "@/lib/db/schema";
import { hasTeamWorkspace } from "@/lib/project-stages";
import { budgetFormSchema } from "@/lib/validations/budget";

export async function saveBudget(
  projectId: string,
  status: string,
  data: unknown,
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };
  if (status !== "proposed" && status !== "final") {
    return { error: "Invalid budget stage." };
  }

  const project = await db.query.projects.findFirst({
    where: (projects, { eq }) => eq(projects.id, projectId),
    columns: { id: true, stage: true },
  });
  if (!project) return { error: "Project not found." };
  if (!(await canManageProject(session, project))) {
    return {
      error: "You do not have permission to edit this project's budget.",
    };
  }
  if (!hasTeamWorkspace(project.stage)) {
    return { error: "Detailed budgets become available at the Sprout stage." };
  }

  const parsed = budgetFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }

  await db
    .insert(projectBudgets)
    .values({
      projectId,
      status,
      lineItems: parsed.data.lineItems,
      notes: parsed.data.notes || null,
      isPublic: parsed.data.isPublic,
      updatedBy: session.user.id,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [projectBudgets.projectId, projectBudgets.status],
      set: {
        lineItems: parsed.data.lineItems,
        notes: parsed.data.notes || null,
        isPublic: parsed.data.isPublic,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      },
    });

  revalidatePath(`/seeds/${projectId}`);
  revalidatePath(`/seeds/${projectId}/team`);
  return { success: true };
}
