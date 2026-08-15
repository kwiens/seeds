import { relations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  doublePrecision,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const categoryEnum = pgEnum("category", [
  "daily_access",
  "outdoor_play",
  "balanced_growth",
  "respect",
  "connected_communities",
]);

export const projectStageEnum = pgEnum("project_stage", [
  "seed",
  "sprout",
  "tree",
]);

export const approvalStateEnum = pgEnum("approval_state", [
  "draft",
  "pending",
  "approved",
]);

export const roleEnum = pgEnum("role", ["user", "admin", "council"]);

export const participantRoleEnum = pgEnum("participant_role", [
  "supporter",
  "gardener",
  "member",
  "steward",
  "co_gardener",
  "guide",
  "roots",
  "cultivator",
]);

export const participantStateEnum = pgEnum("participant_state", [
  "prospective",
  "invited",
  "active",
  "inactive",
]);

export const updateVisibilityEnum = pgEnum("update_visibility", [
  "public",
  "team",
]);

export const budgetStatusEnum = pgEnum("budget_status", ["proposed", "final"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  image: text("image"),
  role: roleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// A project keeps the same identity as it grows from Seed to Sprout to Tree.
// Approval and archival are independent axes so lifecycle data is never lost.
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    summary: text("summary").notNull(),
    locationAddress: text("location_address"),
    locationDescription: text("location_description"),
    locationLat: doublePrecision("location_lat"),
    locationLng: doublePrecision("location_lng"),
    category: categoryEnum("category").notNull(),
    waterHave: jsonb("water_have").$type<string[]>().notNull().default([]),
    waterNeed: jsonb("water_need").$type<string[]>().notNull().default([]),
    budgetEstimate: text("budget_estimate"),
    obstacles: text("obstacles"),
    imageUrl: text("image_url"),
    photos: jsonb("photos").$type<string[]>().notNull().default([]),
    coverPhotoUrl: text("cover_photo_url"),
    badges: jsonb("badges").$type<string[]>().notNull().default([]),
    stage: projectStageEnum("stage").notNull().default("seed"),
    approvalState: approvalStateEnum("approval_state")
      .notNull()
      .default("pending"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_projects_badges").using("gin", t.badges),
    index("idx_projects_stage_approval").on(t.stage, t.approvalState),
  ],
);

export const projectApprovals = pgTable("project_approvals", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  approvedBy: uuid("approved_by")
    .notNull()
    .references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// One row represents one person's role on a project. A person can have several
// rows, allowing supporter and team roles to coexist with independent states.
// displayName also supports people/organizations that do not yet have accounts.
export const projectParticipants = pgTable(
  "project_participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id),
    displayName: text("display_name").notNull(),
    role: participantRoleEnum("role").notNull(),
    state: participantStateEnum("state").notNull().default("active"),
    addedBy: uuid("added_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("project_participants_user_role_unique")
      .on(t.projectId, t.userId, t.role)
      .where(sql`${t.userId} is not null`),
    uniqueIndex("project_participants_named_role_unique")
      .on(t.projectId, t.displayName, t.role)
      .where(sql`${t.userId} is null`),
    index("idx_project_participants_project_state").on(t.projectId, t.state),
  ],
);

export const projectComments = pgTable("project_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  parentId: uuid("parent_id").references(
    (): AnyPgColumn => projectComments.id,
    { onDelete: "cascade" },
  ),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

// Public progress posts and private team discussion share one model. Visibility
// controls authorization and presentation; parentId is used for team replies.
export const projectUpdates = pgTable(
  "project_updates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    visibility: updateVisibilityEnum("visibility").notNull(),
    title: text("title"),
    body: jsonb("body").notNull(),
    parentId: uuid("parent_id").references(
      (): AnyPgColumn => projectUpdates.id,
      { onDelete: "cascade" },
    ),
    photos: jsonb("photos").$type<string[]>().notNull().default([]),
    attachments: jsonb("attachments")
      .$type<{ name: string; url: string; size: number }[]>()
      .notNull()
      .default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_project_updates_project_visibility_created").on(
      t.projectId,
      t.visibility,
      t.createdAt,
    ),
    index("idx_project_updates_parent").on(t.parentId),
  ],
);

// Durable outbox for private Blob cleanup. It intentionally has no project FK
// so queued file deletions survive a cascading project deletion.
export const projectUpdateFileDeletions = pgTable(
  "project_update_file_deletions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").notNull(),
    url: text("url").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

export const projectActivityReads = pgTable(
  "project_activity_reads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    visibility: updateVisibilityEnum("visibility").notNull().default("team"),
    lastReadAt: timestamp("last_read_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("project_activity_reads_unique").on(
      t.projectId,
      t.userId,
      t.visibility,
    ),
  ],
);

// Detailed proposed/final budgets are additive Sprout/Tree capabilities. The
// early-stage estimate remains projects.budgetEstimate.
export const projectBudgets = pgTable(
  "project_budgets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    status: budgetStatusEnum("status").notNull(),
    lineItems: jsonb("line_items")
      .$type<{ label: string; amount: number }[]>()
      .notNull()
      .default([]),
    notes: text("notes"),
    isPublic: boolean("is_public").notNull().default(false),
    updatedBy: uuid("updated_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("project_budgets_unique").on(t.projectId, t.status)],
);

export const projectEvents = pgTable(
  "project_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    location: text("location"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_project_events_project_starts").on(t.projectId, t.startsAt),
  ],
);

export const adminEmails = pgTable("admin_emails", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  addedBy: uuid("added_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  createdProjects: many(projects),
  participations: many(projectParticipants, {
    relationName: "participantUser",
  }),
  addedParticipations: many(projectParticipants, {
    relationName: "participantAddedBy",
  }),
  approvals: many(projectApprovals),
  comments: many(projectComments),
  updates: many(projectUpdates),
  activityReads: many(projectActivityReads),
  budgetUpdates: many(projectBudgets),
  events: many(projectEvents),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  creator: one(users, { fields: [projects.createdBy], references: [users.id] }),
  participants: many(projectParticipants),
  approvals: many(projectApprovals),
  comments: many(projectComments),
  updates: many(projectUpdates),
  activityReads: many(projectActivityReads),
  budgets: many(projectBudgets),
  events: many(projectEvents),
}));

export const projectParticipantsRelations = relations(
  projectParticipants,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectParticipants.projectId],
      references: [projects.id],
    }),
    user: one(users, {
      fields: [projectParticipants.userId],
      references: [users.id],
      relationName: "participantUser",
    }),
    addedByUser: one(users, {
      fields: [projectParticipants.addedBy],
      references: [users.id],
      relationName: "participantAddedBy",
    }),
  }),
);

export const projectApprovalsRelations = relations(
  projectApprovals,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectApprovals.projectId],
      references: [projects.id],
    }),
    approver: one(users, {
      fields: [projectApprovals.approvedBy],
      references: [users.id],
    }),
  }),
);

export const projectCommentsRelations = relations(
  projectComments,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [projectComments.projectId],
      references: [projects.id],
    }),
    user: one(users, {
      fields: [projectComments.userId],
      references: [users.id],
    }),
    parent: one(projectComments, {
      fields: [projectComments.parentId],
      references: [projectComments.id],
      relationName: "commentReplies",
    }),
    replies: many(projectComments, { relationName: "commentReplies" }),
  }),
);

export const projectUpdatesRelations = relations(
  projectUpdates,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [projectUpdates.projectId],
      references: [projects.id],
    }),
    author: one(users, {
      fields: [projectUpdates.createdBy],
      references: [users.id],
    }),
    parent: one(projectUpdates, {
      fields: [projectUpdates.parentId],
      references: [projectUpdates.id],
      relationName: "projectUpdateReplies",
    }),
    replies: many(projectUpdates, { relationName: "projectUpdateReplies" }),
  }),
);

export const projectActivityReadsRelations = relations(
  projectActivityReads,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectActivityReads.projectId],
      references: [projects.id],
    }),
    user: one(users, {
      fields: [projectActivityReads.userId],
      references: [users.id],
    }),
  }),
);

export const projectBudgetsRelations = relations(projectBudgets, ({ one }) => ({
  project: one(projects, {
    fields: [projectBudgets.projectId],
    references: [projects.id],
  }),
  updatedByUser: one(users, {
    fields: [projectBudgets.updatedBy],
    references: [users.id],
  }),
}));

export const projectEventsRelations = relations(projectEvents, ({ one }) => ({
  project: one(projects, {
    fields: [projectEvents.projectId],
    references: [projects.id],
  }),
  creator: one(users, {
    fields: [projectEvents.createdBy],
    references: [users.id],
  }),
}));

export const adminEmailsRelations = relations(adminEmails, ({ one }) => ({
  addedByUser: one(users, {
    fields: [adminEmails.addedBy],
    references: [users.id],
  }),
}));
