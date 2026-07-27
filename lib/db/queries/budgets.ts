import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { seedBudgets } from "@/lib/db/schema";

export async function getBudgets(seedId: string) {
  const rows = await db.query.seedBudgets.findMany({
    where: eq(seedBudgets.seedId, seedId),
  });

  return {
    proposed: rows.find((r) => r.status === "proposed") ?? null,
    final: rows.find((r) => r.status === "final") ?? null,
  };
}
