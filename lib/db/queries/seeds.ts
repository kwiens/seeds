import { and, count, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { seeds, seedSupports, users } from "@/lib/db/schema";
import type { CategoryKey } from "@/lib/categories";
import {
  publicStatusOrder,
  seedStatuses,
  type StatusKey,
} from "@/lib/statuses";

const SEEDS_PER_PAGE = 20;

/** Build a status filter that expands "approved" to include "pending" (merged Seeds bucket) */
export function statusFilter(status: StatusKey) {
  if (seedStatuses.includes(status)) {
    return or(...seedStatuses.map((s) => eq(seeds.status, s)));
  }
  return eq(seeds.status, status);
}

export const supportCountSql = sql<number>`(
  select count(*) from seed_supports
  where seed_supports.seed_id = seeds.id
)`.as("support_count");

function buildVisibilityFilter(options: {
  category?: CategoryKey;
  userId?: string;
  search?: string;
}) {
  const conditions = [];

  const publicFilter = and(
    ne(seeds.status, "draft"),
    ne(seeds.status, "archived"),
  );

  if (options.userId) {
    conditions.push(or(publicFilter, eq(seeds.createdBy, options.userId)));
  } else {
    conditions.push(publicFilter);
  }

  if (options.category) {
    conditions.push(eq(seeds.category, options.category));
  }

  if (options.search) {
    const pattern = `%${options.search}%`;
    conditions.push(
      or(
        ilike(seeds.name, pattern),
        ilike(seeds.summary, pattern),
        ilike(users.name, pattern),
      ),
    );
  }

  return conditions.length > 1 ? and(...conditions) : conditions[0];
}

export type SortOption = "newest" | "supported" | "mine";

const listSelectFields = {
  id: seeds.id,
  name: seeds.name,
  summary: seeds.summary,
  category: seeds.category,
  imageUrl: seeds.imageUrl,
  coverPhotoUrl: seeds.coverPhotoUrl,
  locationLat: seeds.locationLat,
  locationLng: seeds.locationLng,
  status: seeds.status,
  createdBy: seeds.createdBy,
  createdAt: seeds.createdAt,
  supportCount: supportCountSql,
};

async function queryPagedSeeds(options: {
  category?: CategoryKey;
  status?: StatusKey;
  badges?: string[];
  page?: number;
  userId?: string;
  sort?: SortOption;
  search?: string;
}) {
  const { page = 1, sort = "newest" } = options;
  const offset = (page - 1) * SEEDS_PER_PAGE;

  const conditions = [];
  const base = buildVisibilityFilter(options);
  if (base) conditions.push(base);
  if (options.status) conditions.push(statusFilter(options.status));
  if (options.badges?.length) {
    conditions.push(
      sql`${seeds.badges} @> ${JSON.stringify(options.badges)}::jsonb`,
    );
  }
  const where = conditions.length > 1 ? and(...conditions) : conditions[0];

  // "mine" filter: only seeds the current user has supported
  if (sort === "mine" && options.userId) {
    const mineWhere = and(where, eq(seedSupports.userId, options.userId));

    const [seedRows, countResult] = await Promise.all([
      db
        .select(listSelectFields)
        .from(seeds)
        .innerJoin(users, eq(seeds.createdBy, users.id))
        .innerJoin(seedSupports, eq(seeds.id, seedSupports.seedId))
        .where(mineWhere)
        .orderBy(desc(seedSupports.createdAt))
        .limit(SEEDS_PER_PAGE)
        .offset(offset),
      db
        .select({ count: count() })
        .from(seeds)
        .innerJoin(users, eq(seeds.createdBy, users.id))
        .innerJoin(seedSupports, eq(seeds.id, seedSupports.seedId))
        .where(mineWhere),
    ]);

    return {
      seeds: seedRows,
      totalCount: countResult[0]?.count ?? 0,
      totalPages: Math.ceil((countResult[0]?.count ?? 0) / SEEDS_PER_PAGE),
      currentPage: page,
    };
  }

  const orderBy =
    sort === "supported"
      ? [desc(supportCountSql), desc(seeds.createdAt)]
      : [desc(seeds.createdAt)];

  const [seedRows, countResult] = await Promise.all([
    db
      .select(listSelectFields)
      .from(seeds)
      .innerJoin(users, eq(seeds.createdBy, users.id))
      .where(where)
      .orderBy(...orderBy)
      .limit(SEEDS_PER_PAGE)
      .offset(offset),
    db
      .select({ count: count() })
      .from(seeds)
      .innerJoin(users, eq(seeds.createdBy, users.id))
      .where(where),
  ]);

  return {
    seeds: seedRows,
    totalCount: countResult[0]?.count ?? 0,
    totalPages: Math.ceil((countResult[0]?.count ?? 0) / SEEDS_PER_PAGE),
    currentPage: page,
  };
}

export async function getApprovedSeeds(options: {
  category?: CategoryKey;
  page?: number;
  userId?: string;
  sort?: SortOption;
  search?: string;
}) {
  // Scope Phase 1 home to the Seed bucket (pending+approved) so the grid
  // doesn't mix in sprouts/trees once mature projects exist.
  return queryPagedSeeds({ ...options, status: "approved" });
}

export async function getSeedsByStatus(options: {
  status: StatusKey;
  badges?: string[];
  page?: number;
  sort?: SortOption;
  userId?: string;
  search?: string;
}) {
  return queryPagedSeeds(options);
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
    .where(eq(seeds.createdBy, userId))
    .orderBy(desc(seeds.createdAt));
}

export async function getSupportedSeedsByUser(userId: string) {
  return db
    .select({
      id: seeds.id,
      name: seeds.name,
      summary: seeds.summary,
      category: seeds.category,
      imageUrl: seeds.imageUrl,
      supportCount: supportCountSql,
    })
    .from(seeds)
    .innerJoin(seedSupports, eq(seeds.id, seedSupports.seedId))
    .where(eq(seedSupports.userId, userId))
    .orderBy(desc(seedSupports.createdAt));
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
  status?: StatusKey;
  badges?: string[];
  userId?: string;
  search?: string;
}) {
  const conditions = [];
  const base = buildVisibilityFilter(options);
  if (base) conditions.push(base);
  if (options.status) conditions.push(statusFilter(options.status));
  if (options.badges?.length) {
    conditions.push(
      sql`${seeds.badges} @> ${JSON.stringify(options.badges)}::jsonb`,
    );
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
    .innerJoin(users, eq(seeds.createdBy, users.id))
    .where(where);
}

const PREVIEW_LIMIT = 8;

export async function getSeedPreviewsByStatus(options?: { userId?: string }) {
  const results = await Promise.all(
    publicStatusOrder.map(async (status) => {
      const visibilityBase = buildVisibilityFilter({
        userId: options?.userId,
      });
      const sf = statusFilter(status);
      const where = visibilityBase ? and(visibilityBase, sf) : sf;

      const [seedRows, countResult] = await Promise.all([
        db
          .select({
            id: seeds.id,
            name: seeds.name,
            summary: seeds.summary,
            category: seeds.category,
            imageUrl: seeds.imageUrl,
            coverPhotoUrl: seeds.coverPhotoUrl,
            locationLat: seeds.locationLat,
            locationLng: seeds.locationLng,
            status: seeds.status,
            createdBy: seeds.createdBy,
            createdAt: seeds.createdAt,
            supportCount: supportCountSql,
          })
          .from(seeds)
          .innerJoin(users, eq(seeds.createdBy, users.id))
          .where(where)
          .orderBy(desc(seeds.createdAt))
          .limit(PREVIEW_LIMIT),
        db
          .select({ count: count() })
          .from(seeds)
          .innerJoin(users, eq(seeds.createdBy, users.id))
          .where(where),
      ]);

      return {
        status,
        seeds: seedRows,
        totalCount: countResult[0]?.count ?? 0,
      };
    }),
  );

  return results;
}
