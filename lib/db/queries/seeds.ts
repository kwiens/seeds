import { and, count, desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { seeds, seedSupports, users } from "@/lib/db/schema";
import type { CategoryKey } from "@/lib/categories";

const SEEDS_PER_PAGE = 20;

export const supportCountSql = sql<number>`(
  select count(*) from seed_supports
  where seed_supports.seed_id = seeds.id
)`.as("support_count");

function buildVisibilityFilter(options: {
  category?: CategoryKey;
  userId?: string;
}) {
  const conditions = [];

  if (options.userId) {
    conditions.push(
      or(eq(seeds.status, "approved"), eq(seeds.createdBy, options.userId)),
    );
  } else {
    conditions.push(eq(seeds.status, "approved"));
  }

  if (options.category) {
    conditions.push(eq(seeds.category, options.category));
  }

  return conditions.length > 1 ? and(...conditions) : conditions[0];
}

export type SortOption = "newest" | "supported";

export async function getApprovedSeeds(options: {
  category?: CategoryKey;
  page?: number;
  userId?: string;
  sort?: SortOption;
}) {
  const { page = 1, sort = "newest" } = options;
  const offset = (page - 1) * SEEDS_PER_PAGE;

  const where = buildVisibilityFilter(options);

  const orderBy =
    sort === "supported"
      ? [desc(supportCountSql), desc(seeds.createdAt)]
      : [desc(seeds.createdAt)];

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
        supportCount: supportCountSql,
      })
      .from(seeds)
      .where(where)
      .orderBy(...orderBy)
      .limit(SEEDS_PER_PAGE)
      .offset(offset),
    db.select({ count: count() }).from(seeds).where(where),
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

export async function getSeedSupporters(
  seedId: string,
  options?: { includeEmail?: boolean },
) {
  const includeEmail = options?.includeEmail ?? false;

  const rows = await db
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

  if (includeEmail) return rows;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return rows.map(({ email: _email, ...rest }) => ({ ...rest, email: "" }));
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
  const where = buildVisibilityFilter(options);

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
