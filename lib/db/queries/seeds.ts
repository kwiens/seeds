import { and, count, desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { seeds, seedSupports, users } from "@/lib/db/schema";
import type { CategoryKey } from "@/lib/categories";

const SEEDS_PER_PAGE = 20;

export async function getApprovedSeeds(options: {
  category?: CategoryKey;
  page?: number;
  userId?: string;
}) {
  const { category, page = 1, userId } = options;
  const offset = (page - 1) * SEEDS_PER_PAGE;

  const conditions = [];

  if (userId) {
    // Show approved seeds OR user's own seeds
    conditions.push(
      or(eq(seeds.status, "approved"), eq(seeds.createdBy, userId)),
    );
  } else {
    conditions.push(eq(seeds.status, "approved"));
  }

  if (category) {
    conditions.push(eq(seeds.category, category));
  }

  const where = conditions.length > 1 ? and(...conditions) : conditions[0];

  const [seedRows, countResult] = await Promise.all([
    db
      .select({
        id: seeds.id,
        name: seeds.name,
        summary: seeds.summary,
        category: seeds.category,
        imageUrl: seeds.imageUrl,
        locationLat: seeds.locationLat,
        locationLng: seeds.locationLng,
        status: seeds.status,
        createdBy: seeds.createdBy,
        createdAt: seeds.createdAt,
        supportCount: sql<number>`(
          select count(*) from seed_supports
          where seed_supports.seed_id = seeds.id
        )`.as("support_count"),
      })
      .from(seeds)
      .where(where)
      .orderBy(desc(seeds.createdAt))
      .limit(SEEDS_PER_PAGE)
      .offset(offset),
    db
      .select({ count: count() })
      .from(seeds)
      .where(where),
  ]);

  return {
    seeds: seedRows,
    totalCount: countResult[0]?.count ?? 0,
    totalPages: Math.ceil((countResult[0]?.count ?? 0) / SEEDS_PER_PAGE),
    currentPage: page,
  };
}

export async function getSeedById(id: string) {
  const result = await db.query.seeds.findFirst({
    where: eq(seeds.id, id),
    with: {
      creator: true,
    },
  });
  return result ?? null;
}

export async function getSeedsByUser(userId: string) {
  return db
    .select({
      id: seeds.id,
      name: seeds.name,
      category: seeds.category,
      status: seeds.status,
      createdAt: seeds.createdAt,
      supportCount: sql<number>`(
        select count(*) from seed_supports
        where seed_supports.seed_id = seeds.id
      )`.as("support_count"),
    })
    .from(seeds)
    .where(and(eq(seeds.createdBy, userId), sql`${seeds.status} != 'archived'`))
    .orderBy(desc(seeds.createdAt));
}

export async function getSeedSupportCount(seedId: string) {
  const result = await db
    .select({ count: count() })
    .from(seedSupports)
    .where(eq(seedSupports.seedId, seedId));
  return result[0]?.count ?? 0;
}

export async function getSeedSupporters(seedId: string) {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: seedSupports.createdAt,
    })
    .from(seedSupports)
    .innerJoin(users, eq(seedSupports.userId, users.id))
    .where(eq(seedSupports.seedId, seedId))
    .orderBy(desc(seedSupports.createdAt));
}

export async function hasUserSupported(seedId: string, userId: string) {
  const result = await db.query.seedSupports.findFirst({
    where: and(
      eq(seedSupports.seedId, seedId),
      eq(seedSupports.userId, userId),
    ),
  });
  return !!result;
}

export async function getAllSeedsForMap(options: {
  category?: CategoryKey;
  userId?: string;
}) {
  const { category, userId } = options;
  const conditions = [];

  if (userId) {
    conditions.push(
      or(eq(seeds.status, "approved"), eq(seeds.createdBy, userId)),
    );
  } else {
    conditions.push(eq(seeds.status, "approved"));
  }

  if (category) {
    conditions.push(eq(seeds.category, category));
  }

  const where = conditions.length > 1 ? and(...conditions) : conditions[0];

  return db
    .select({
      id: seeds.id,
      name: seeds.name,
      category: seeds.category,
      locationLat: seeds.locationLat,
      locationLng: seeds.locationLng,
    })
    .from(seeds)
    .where(where);
}
