"use server";

import { eq, desc, ne, sql, count } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { seeds, seedSupports, users } from "@/lib/db/schema";
import { categories, type CategoryKey } from "@/lib/categories";

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
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

export async function exportContributorsCsv(): Promise<string> {
  await requireAdmin();

  const rows = await db
    .select({
      seedName: seeds.name,
      category: seeds.category,
      status: seeds.status,
      creatorName: users.name,
      creatorEmail: users.email,
      createdAt: seeds.createdAt,
    })
    .from(seeds)
    .innerJoin(users, eq(seeds.createdBy, users.id))
    .where(ne(seeds.status, "archived"))
    .orderBy(desc(seeds.createdAt));

  const header = toCsvRow([
    "Seed Name",
    "Category",
    "Status",
    "Contributor Name",
    "Contributor Email",
    "Created At",
  ]);

  const lines = rows.map((r) =>
    toCsvRow([
      r.seedName,
      r.category,
      r.status,
      r.creatorName,
      r.creatorEmail,
      r.createdAt.toISOString(),
    ]),
  );

  return [header, ...lines].join("\n");
}

export async function exportSeedsCsv(): Promise<string> {
  await requireAdmin();

  const supportCounts = db
    .select({
      seedId: seedSupports.seedId,
      count: count().as("support_count"),
    })
    .from(seedSupports)
    .groupBy(seedSupports.seedId)
    .as("support_counts");

  const rows = await db
    .select({
      id: seeds.id,
      name: seeds.name,
      summary: seeds.summary,
      category: seeds.category,
      status: seeds.status,
      gardeners: seeds.gardeners,
      locationAddress: seeds.locationAddress,
      locationDescription: seeds.locationDescription,
      roots: seeds.roots,
      supportPeople: seeds.supportPeople,
      waterHave: seeds.waterHave,
      waterNeed: seeds.waterNeed,
      budget: seeds.budget,
      obstacles: seeds.obstacles,
      createdAt: seeds.createdAt,
      creatorName: users.name,
      creatorEmail: users.email,
      supportCount: sql<number>`coalesce(${supportCounts.count}, 0)`,
    })
    .from(seeds)
    .innerJoin(users, eq(seeds.createdBy, users.id))
    .leftJoin(supportCounts, eq(seeds.id, supportCounts.seedId))
    .where(ne(seeds.status, "archived"))
    .orderBy(desc(seeds.createdAt));

  const header = toCsvRow([
    "ID",
    "Name",
    "Category",
    "Status",
    "Summary",
    "Gardeners",
    "Location",
    "Location Description",
    "Roots",
    "Guides",
    "Fertilizer (Have)",
    "Water (Need)",
    "Budget",
    "Obstacles",
    "URL",
    "Created At",
    "Supporters",
    "Creator Name",
    "Creator Email",
  ]);

  const joinArray = (val: unknown): string =>
    Array.isArray(val) ? val.join("; ") : "";

  const lines = rows.map((r) => {
    const roots = Array.isArray(r.roots)
      ? (r.roots as { name: string; committed: boolean }[])
          .map((root) => `${root.name}${root.committed ? " (committed)" : ""}`)
          .join("; ")
      : "";

    return toCsvRow([
      r.id,
      r.name,
      categories[r.category as CategoryKey]?.label ?? r.category,
      r.status,
      r.summary,
      joinArray(r.gardeners),
      r.locationAddress ?? "",
      r.locationDescription ?? "",
      roots,
      joinArray(r.supportPeople),
      joinArray(r.waterHave),
      joinArray(r.waterNeed),
      r.budget ?? "",
      r.obstacles ?? "",
      `https://www.npcseeds.org/seeds/${r.id}`,
      r.createdAt.toISOString(),
      String(r.supportCount),
      r.creatorName,
      r.creatorEmail,
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
    .from(seedSupports)
    .innerJoin(users, eq(seedSupports.userId, users.id))
    .innerJoin(seeds, eq(seedSupports.seedId, seeds.id))
    .where(ne(seeds.status, "archived"))
    .orderBy(users.email);

  const header = toCsvRow(["Name", "Email"]);

  const lines = rows.map((r) => toCsvRow([r.supporterName, r.supporterEmail]));

  return [header, ...lines].join("\n");
}
