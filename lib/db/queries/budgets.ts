import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectBudgets } from "@/lib/db/schema";

export async function getBudgets(projectId: string) {
  const rows = await db.query.projectBudgets.findMany({
    where: eq(projectBudgets.projectId, projectId),
  });
  return {
    proposed: rows.find((row) => row.status === "proposed") ?? null,
    final: rows.find((row) => row.status === "final") ?? null,
  };
}

export async function getPublicBudgets(projectId: string) {
  return db.query.projectBudgets.findMany({
    where: and(
      eq(projectBudgets.projectId, projectId),
      eq(projectBudgets.isPublic, true),
    ),
  });
}
