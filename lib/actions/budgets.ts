"use server";

import { db } from "@/lib/db";
import { projectBudgets } from "@/lib/db/schema";
import { requireProjectAccess } from "@/lib/project-access";
import { revalidateProject } from "@/lib/revalidate";
import { budgetFormSchema } from "@/lib/validations/budget";
import { type ActionResult, firstIssue } from "./result";

export async function saveBudget(
  projectId: string,
  status: string,
  data: unknown,
): Promise<ActionResult> {
  if (status !== "proposed" && status !== "final") {
    return { error: "Invalid budget stage." };
  }

  const access = await requireProjectAccess(projectId, {
    level: "manage",
    requireWorkspace: true,
    forbidden: "You do not have permission to edit this project's budget.",
    unavailable: "Detailed budgets become available at the Sprout stage.",
  });
  if ("error" in access) return access;
  const { session } = access;

  const parsed = budgetFormSchema.safeParse(data);
  if (!parsed.success) return { error: firstIssue(parsed) };

  const fields = {
    lineItems: parsed.data.lineItems,
    notes: parsed.data.notes || null,
    isPublic: parsed.data.isPublic,
    updatedBy: session.user.id,
    updatedAt: new Date(),
  };
  await db
    .insert(projectBudgets)
    .values({ projectId, status, ...fields })
    .onConflictDoUpdate({
      target: [projectBudgets.projectId, projectBudgets.status],
      set: fields,
    });

  revalidateProject(projectId);
  return { success: true };
}
