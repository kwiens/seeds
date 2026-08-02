"use server";

import { and, count, desc, eq, isNull, ne, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { categories, type CategoryKey } from "@/lib/categories";
import { db } from "@/lib/db";
import { projectParticipants, projects, users } from "@/lib/db/schema";

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsvRow(fields: string[]): string {
  return fields.map(escapeCsvField).join(",");
}

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Unauthorized");
}

export async function exportContributorsCsv(): Promise<string> {
  await requireAdmin();
  const rows = await db
    .select({
      projectName: projects.name,
      category: projects.category,
      stage: projects.stage,
      approvalState: projects.approvalState,
      creatorName: users.name,
      creatorEmail: users.email,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .innerJoin(users, eq(projects.createdBy, users.id))
    .where(isNull(projects.archivedAt))
    .orderBy(desc(projects.createdAt));

  const header = toCsvRow([
    "Project Name",
    "Category",
    "Stage",
    "Approval State",
    "Contributor Name",
    "Contributor Email",
    "Created At",
  ]);
  const lines = rows.map((row) =>
    toCsvRow([
      row.projectName,
      row.category,
      row.stage,
      row.approvalState,
      row.creatorName,
      row.creatorEmail,
      row.createdAt.toISOString(),
    ]),
  );
  return [header, ...lines].join("\n");
}

export async function exportSeedsCsv(): Promise<string> {
  await requireAdmin();

  const supportCounts = db
    .select({
      projectId: projectParticipants.projectId,
      count: count().as("support_count"),
    })
    .from(projectParticipants)
    .where(
      and(
        eq(projectParticipants.role, "supporter"),
        eq(projectParticipants.state, "active"),
      ),
    )
    .groupBy(projectParticipants.projectId)
    .as("support_counts");

  const [rows, participants] = await Promise.all([
    db
      .select({
        id: projects.id,
        name: projects.name,
        summary: projects.summary,
        category: projects.category,
        stage: projects.stage,
        approvalState: projects.approvalState,
        locationAddress: projects.locationAddress,
        locationDescription: projects.locationDescription,
        waterHave: projects.waterHave,
        waterNeed: projects.waterNeed,
        budgetEstimate: projects.budgetEstimate,
        obstacles: projects.obstacles,
        createdAt: projects.createdAt,
        creatorName: users.name,
        creatorEmail: users.email,
        supportCount: sql<number>`coalesce(${supportCounts.count}, 0)`,
      })
      .from(projects)
      .innerJoin(users, eq(projects.createdBy, users.id))
      .leftJoin(supportCounts, eq(projects.id, supportCounts.projectId))
      .where(isNull(projects.archivedAt))
      .orderBy(desc(projects.createdAt)),
    db
      .select({
        projectId: projectParticipants.projectId,
        displayName: projectParticipants.displayName,
        role: projectParticipants.role,
        state: projectParticipants.state,
      })
      .from(projectParticipants)
      .where(
        and(
          ne(projectParticipants.role, "supporter"),
          ne(projectParticipants.state, "inactive"),
        ),
      ),
  ]);

  const participantsByProject = new Map<string, typeof participants>();
  for (const participant of participants) {
    const list = participantsByProject.get(participant.projectId) ?? [];
    list.push(participant);
    participantsByProject.set(participant.projectId, list);
  }

  const header = toCsvRow([
    "ID",
    "Name",
    "Category",
    "Stage",
    "Approval State",
    "Summary",
    "Gardeners",
    "Location",
    "Location Description",
    "Roots",
    "Guides",
    "Fertilizer (Have)",
    "Water (Need)",
    "Budget Estimate",
    "Obstacles",
    "URL",
    "Created At",
    "Supporters",
    "Creator Name",
    "Creator Email",
  ]);

  const lines = rows.map((row) => {
    const projectPeople = participantsByProject.get(row.id) ?? [];
    const namesFor = (role: (typeof projectPeople)[number]["role"]) =>
      projectPeople
        .filter((participant) => participant.role === role)
        .map((participant) => participant.displayName)
        .join("; ");
    const roots = projectPeople
      .filter((participant) => participant.role === "roots")
      .map(
        (participant) =>
          `${participant.displayName}${participant.state === "active" ? " (committed)" : ""}`,
      )
      .join("; ");

    return toCsvRow([
      row.id,
      row.name,
      categories[row.category as CategoryKey]?.label ?? row.category,
      row.stage,
      row.approvalState,
      row.summary,
      namesFor("gardener"),
      row.locationAddress ?? "",
      row.locationDescription ?? "",
      roots,
      namesFor("guide"),
      row.waterHave.join("; "),
      row.waterNeed.join("; "),
      row.budgetEstimate ?? "",
      row.obstacles ?? "",
      `https://www.npcseeds.org/seeds/${row.id}`,
      row.createdAt.toISOString(),
      String(row.supportCount),
      row.creatorName,
      row.creatorEmail,
    ]);
  });
  return [header, ...lines].join("\n");
}

export async function exportSupportersCsv(): Promise<string> {
  await requireAdmin();
  const rows = await db
    .selectDistinctOn([users.email], {
      supporterName: users.name,
      supporterEmail: users.email,
    })
    .from(projectParticipants)
    .innerJoin(users, eq(projectParticipants.userId, users.id))
    .innerJoin(projects, eq(projectParticipants.projectId, projects.id))
    .where(
      and(
        eq(projectParticipants.role, "supporter"),
        eq(projectParticipants.state, "active"),
        isNull(projects.archivedAt),
      ),
    )
    .orderBy(users.email);

  const header = toCsvRow(["Name", "Email"]);
  const lines = rows.map((row) =>
    toCsvRow([row.supporterName, row.supporterEmail]),
  );
  return [header, ...lines].join("\n");
}
