"use server";

import { eq, desc, ne } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { seeds, seedSupports, users } from "@/lib/db/schema";

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
