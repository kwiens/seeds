import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectUpdates, users } from "@/lib/db/schema";

export interface ProjectDocument {
  name: string;
  url: string;
  size: number;
  updateId: string;
  attachmentIndex: number;
  posterName: string;
  createdAt: Date;
}

export async function getProjectDocuments(
  projectId: string,
): Promise<ProjectDocument[]> {
  const rows = await db
    .select({
      id: projectUpdates.id,
      attachments: projectUpdates.attachments,
      createdAt: projectUpdates.createdAt,
      posterName: users.name,
    })
    .from(projectUpdates)
    .innerJoin(users, eq(projectUpdates.createdBy, users.id))
    .where(
      and(
        eq(projectUpdates.projectId, projectId),
        eq(projectUpdates.visibility, "team"),
      ),
    );

  return rows
    .flatMap((row) =>
      row.attachments.map((file, attachmentIndex) => ({
        ...file,
        updateId: row.id,
        attachmentIndex,
        posterName: row.posterName,
        createdAt: row.createdAt,
      })),
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
