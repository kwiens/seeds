import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { assertSafeDatabaseUrl, isProductionDatabase } from "@/lib/db/safety";
import { db } from "@/lib/db";
import {
  projects,
  projectParticipants,
  projectComments,
  users,
} from "@/lib/db/schema";
import { e2eTestUsers } from "./test-users";

export const paginationProjectId = process.env.E2E_PAGINATION_PROJECT_ID!;
export const paginationSupporterEmail = (index: number) =>
  `e2e-pr53-${paginationProjectId}-supporter-${index}@npcseeds.test`;
export const paginationOwner = {
  email: `e2e-pagination-${paginationProjectId}@npcseeds.test`,
  name: "E2E Pagination Owner",
  role: "user" as const,
  createdAt: new Date("2026-08-01T00:00:00Z"),
};
export const paginationProjectPrefix = `E2E PR53 ${paginationProjectId} project`;

export async function seedPaginationData() {
  const databaseUrl = assertSafeDatabaseUrl(process.env.DATABASE_URL);
  if (isProductionDatabase(databaseUrl))
    throw new Error("Cannot seed Production.");
  const ownerId = randomUUID();
  const supporterUsers = Array.from({ length: 501 }, (_, index) => ({
    id: randomUUID(),
    email: paginationSupporterEmail(index),
    name: `E2E Supporter ${index}`,
  }));
  const projectIds = Array.from({ length: 201 }, (_, index) =>
    index === 0 ? paginationProjectId : randomUUID(),
  );
  const cleanup = async () => {
    await db.delete(projects).where(inArray(projects.id, projectIds));
    await db
      .delete(users)
      .where(inArray(users.id, [ownerId, ...supporterUsers.map((u) => u.id)]));
  };
  try {
    await db.insert(users).values({ ...paginationOwner, id: ownerId });
    await db.insert(users).values(supporterUsers);
    const admin = await db.query.users.findFirst({
      where: eq(users.email, e2eTestUsers.admin.email),
    });
    if (!admin) throw new Error("Missing E2E admin.");
    await db.insert(projects).values(
      projectIds.map((id, index) => ({
        id,
        name: `${paginationProjectPrefix} ${String(index).padStart(3, "0")}`,
        summary: "Pagination regression fixture",
        category: "daily_access" as const,
        createdBy: index === 0 ? admin.id : ownerId,
        stage: "seed" as const,
        approvalState: "approved" as const,
        createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)),
      })),
    );
    await db.insert(projectParticipants).values([
      {
        projectId: paginationProjectId,
        userId: ownerId,
        displayName: paginationOwner.name,
        role: "co_gardener" as const,
        state: "active" as const,
      },
      ...supporterUsers.map((user) => ({
        projectId: paginationProjectId,
        userId: user.id,
        displayName: user.name,
        role: "supporter" as const,
        state: "active" as const,
      })),
    ]);
    await db.insert(projectComments).values({
      projectId: paginationProjectId,
      userId: ownerId,
      content: "E2E pagination comment",
    });
    return cleanup;
  } catch (error) {
    await cleanup();
    throw error;
  }
}
