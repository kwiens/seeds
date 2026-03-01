import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminEmails, seedSupports, seeds, users } from "@/lib/db/schema";
import { supportCountSql } from "./seeds";

export async function getAllSeeds() {
  return db
    .select({
      id: seeds.id,
      name: seeds.name,
      category: seeds.category,
      status: seeds.status,
      createdAt: seeds.createdAt,
      creatorName: users.name,
      creatorEmail: users.email,
      supportCount: supportCountSql,
    })
    .from(seeds)
    .innerJoin(users, eq(seeds.createdBy, users.id))
    .orderBy(desc(seeds.createdAt));
}

export async function getSupporterEmailsMap() {
  const rows = await db
    .select({
      seedId: seedSupports.seedId,
      email: users.email,
    })
    .from(seedSupports)
    .innerJoin(users, eq(seedSupports.userId, users.id));

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const emails = map.get(row.seedId);
    if (emails) {
      emails.push(row.email);
    } else {
      map.set(row.seedId, [row.email]);
    }
  }
  return map;
}

export async function getAdminEmails() {
  return db
    .select({
      id: adminEmails.id,
      email: adminEmails.email,
      addedByName: users.name,
      createdAt: adminEmails.createdAt,
    })
    .from(adminEmails)
    .leftJoin(users, eq(adminEmails.addedBy, users.id))
    .orderBy(desc(adminEmails.createdAt));
}

export async function isDbAdminEmail(email: string): Promise<boolean> {
  const row = await db.query.adminEmails.findFirst({
    where: eq(adminEmails.email, email.toLowerCase()),
    columns: { id: true },
  });
  return !!row;
}
