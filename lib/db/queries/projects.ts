import { and, count, desc, eq, ilike, isNull, ne, or, sql } from "drizzle-orm";
import type { CategoryKey } from "@/lib/categories";
import { db } from "@/lib/db";
import { projectParticipants, projects, users } from "@/lib/db/schema";
import {
  publicProjectStageOrder,
  type ProjectStage,
} from "@/lib/project-stages";

const PROJECTS_PER_PAGE = 20;

export const supportCountSql = sql<number>`(
  select count(*) from project_participants
  where project_participants.project_id = projects.id
    and project_participants.role = 'supporter'
    and project_participants.state = 'active'
)`.as("support_count");

function buildVisibilityFilter(options: {
  category?: CategoryKey;
  userId?: string;
  search?: string;
}) {
  const conditions = [];
  const publicFilter = and(
    ne(projects.approvalState, "draft"),
    isNull(projects.archivedAt),
  );

  // Creators also see their own draft/pending projects in listings, but
  // archived projects stay hidden from Explore for everyone — including
  // their creator, who still finds them in the dashboard.
  conditions.push(
    options.userId
      ? or(
          publicFilter,
          and(
            eq(projects.createdBy, options.userId),
            isNull(projects.archivedAt),
          ),
        )
      : publicFilter,
  );

  if (options.category) {
    conditions.push(eq(projects.category, options.category));
  }

  if (options.search) {
    const pattern = `%${options.search}%`;
    conditions.push(
      or(
        ilike(projects.name, pattern),
        ilike(projects.summary, pattern),
        ilike(users.name, pattern),
      ),
    );
  }

  return conditions.length > 1 ? and(...conditions) : conditions[0];
}

export type SortOption = "newest" | "supported" | "mine";

const listSelectFields = {
  id: projects.id,
  name: projects.name,
  summary: projects.summary,
  category: projects.category,
  imageUrl: projects.imageUrl,
  coverPhotoUrl: projects.coverPhotoUrl,
  locationLat: projects.locationLat,
  locationLng: projects.locationLng,
  stage: projects.stage,
  approvalState: projects.approvalState,
  archivedAt: projects.archivedAt,
  createdBy: projects.createdBy,
  createdAt: projects.createdAt,
  supportCount: supportCountSql,
};

async function queryPagedProjects(options: {
  category?: CategoryKey;
  stage?: ProjectStage;
  badges?: string[];
  page?: number;
  userId?: string;
  sort?: SortOption;
  search?: string;
}) {
  const { page = 1, sort = "newest" } = options;
  const offset = (page - 1) * PROJECTS_PER_PAGE;

  const conditions = [];
  const base = buildVisibilityFilter(options);
  if (base) conditions.push(base);
  if (options.stage) conditions.push(eq(projects.stage, options.stage));
  if (options.badges?.length) {
    conditions.push(
      sql`${projects.badges} @> ${JSON.stringify(options.badges)}::jsonb`,
    );
  }

  if (sort === "mine" && options.userId) {
    conditions.push(
      eq(projectParticipants.userId, options.userId),
      eq(projectParticipants.role, "supporter"),
      eq(projectParticipants.state, "active"),
    );
    const where = and(...conditions);

    const [projectRows, countResult] = await Promise.all([
      db
        .select(listSelectFields)
        .from(projects)
        .innerJoin(users, eq(projects.createdBy, users.id))
        .innerJoin(
          projectParticipants,
          eq(projects.id, projectParticipants.projectId),
        )
        .where(where)
        .orderBy(desc(projectParticipants.updatedAt))
        .limit(PROJECTS_PER_PAGE)
        .offset(offset),
      db
        .select({ count: count() })
        .from(projects)
        .innerJoin(users, eq(projects.createdBy, users.id))
        .innerJoin(
          projectParticipants,
          eq(projects.id, projectParticipants.projectId),
        )
        .where(where),
    ]);

    return {
      projects: projectRows,
      totalCount: countResult[0]?.count ?? 0,
      totalPages: Math.ceil((countResult[0]?.count ?? 0) / PROJECTS_PER_PAGE),
      currentPage: page,
    };
  }

  const where = conditions.length > 1 ? and(...conditions) : conditions[0];
  const orderBy =
    sort === "supported"
      ? [desc(supportCountSql), desc(projects.createdAt)]
      : [desc(projects.createdAt)];

  const [projectRows, countResult] = await Promise.all([
    db
      .select(listSelectFields)
      .from(projects)
      .innerJoin(users, eq(projects.createdBy, users.id))
      .where(where)
      .orderBy(...orderBy)
      .limit(PROJECTS_PER_PAGE)
      .offset(offset),
    db
      .select({ count: count() })
      .from(projects)
      .innerJoin(users, eq(projects.createdBy, users.id))
      .where(where),
  ]);

  return {
    projects: projectRows,
    totalCount: countResult[0]?.count ?? 0,
    totalPages: Math.ceil((countResult[0]?.count ?? 0) / PROJECTS_PER_PAGE),
    currentPage: page,
  };
}

export async function getSeedStageProjects(options: {
  category?: CategoryKey;
  page?: number;
  userId?: string;
  sort?: SortOption;
  search?: string;
}) {
  return queryPagedProjects({ ...options, stage: "seed" });
}

export async function getProjectsByStage(options: {
  stage: ProjectStage;
  badges?: string[];
  page?: number;
  sort?: SortOption;
  userId?: string;
  search?: string;
}) {
  return queryPagedProjects(options);
}

export async function getProjectById(id: string) {
  return (
    (await db.query.projects.findFirst({
      where: eq(projects.id, id),
      with: {
        creator: true,
        participants: true,
      },
    })) ?? null
  );
}

export async function getProjectsCreatedByUser(userId: string) {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      category: projects.category,
      stage: projects.stage,
      approvalState: projects.approvalState,
      archivedAt: projects.archivedAt,
      createdAt: projects.createdAt,
      supportCount: supportCountSql,
    })
    .from(projects)
    .where(eq(projects.createdBy, userId))
    .orderBy(desc(projects.createdAt));
}

export async function getSupportedProjectsByUser(userId: string) {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      summary: projects.summary,
      category: projects.category,
      imageUrl: projects.imageUrl,
      coverPhotoUrl: projects.coverPhotoUrl,
      stage: projects.stage,
      approvalState: projects.approvalState,
      supportCount: supportCountSql,
    })
    .from(projects)
    .innerJoin(
      projectParticipants,
      eq(projects.id, projectParticipants.projectId),
    )
    .where(
      and(
        eq(projectParticipants.userId, userId),
        eq(projectParticipants.role, "supporter"),
        eq(projectParticipants.state, "active"),
      ),
    )
    .orderBy(desc(projectParticipants.updatedAt));
}

export async function getProjectSupportCount(projectId: string) {
  const result = await db
    .select({ count: count() })
    .from(projectParticipants)
    .where(
      and(
        eq(projectParticipants.projectId, projectId),
        eq(projectParticipants.role, "supporter"),
        eq(projectParticipants.state, "active"),
      ),
    );
  return result[0]?.count ?? 0;
}

export async function getProjectSupporters(
  projectId: string,
  options?: { includeEmail?: boolean },
) {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: projectParticipants.createdAt,
    })
    .from(projectParticipants)
    .innerJoin(users, eq(projectParticipants.userId, users.id))
    .where(
      and(
        eq(projectParticipants.projectId, projectId),
        eq(projectParticipants.role, "supporter"),
        eq(projectParticipants.state, "active"),
      ),
    )
    .orderBy(desc(projectParticipants.createdAt));

  if (options?.includeEmail) return rows;
  return rows.map((row) => ({ ...row, email: "" }));
}

export async function hasUserSupported(projectId: string, userId: string) {
  const result = await db.query.projectParticipants.findFirst({
    where: and(
      eq(projectParticipants.projectId, projectId),
      eq(projectParticipants.userId, userId),
      eq(projectParticipants.role, "supporter"),
      eq(projectParticipants.state, "active"),
    ),
    columns: { id: true },
  });
  return !!result;
}

export async function getAllProjectsForMap(options: {
  category?: CategoryKey;
  stage?: ProjectStage;
  badges?: string[];
  userId?: string;
  search?: string;
}) {
  const conditions = [];
  const base = buildVisibilityFilter(options);
  if (base) conditions.push(base);
  if (options.stage) conditions.push(eq(projects.stage, options.stage));
  if (options.badges?.length) {
    conditions.push(
      sql`${projects.badges} @> ${JSON.stringify(options.badges)}::jsonb`,
    );
  }
  const where = conditions.length > 1 ? and(...conditions) : conditions[0];

  return db
    .select({
      id: projects.id,
      name: projects.name,
      category: projects.category,
      locationLat: projects.locationLat,
      locationLng: projects.locationLng,
    })
    .from(projects)
    .innerJoin(users, eq(projects.createdBy, users.id))
    .where(where);
}

const PREVIEW_LIMIT = 8;

export async function getProjectPreviewsByStage(options?: { userId?: string }) {
  return Promise.all(
    publicProjectStageOrder.map(async (stage) => {
      const visibilityBase = buildVisibilityFilter({ userId: options?.userId });
      const where = visibilityBase
        ? and(visibilityBase, eq(projects.stage, stage))
        : eq(projects.stage, stage);

      const [projectRows, countResult] = await Promise.all([
        db
          .select(listSelectFields)
          .from(projects)
          .innerJoin(users, eq(projects.createdBy, users.id))
          .where(where)
          .orderBy(desc(projects.createdAt))
          .limit(PREVIEW_LIMIT),
        db
          .select({ count: count() })
          .from(projects)
          .innerJoin(users, eq(projects.createdBy, users.id))
          .where(where),
      ]);

      return {
        stage,
        projects: projectRows,
        totalCount: countResult[0]?.count ?? 0,
      };
    }),
  );
}
