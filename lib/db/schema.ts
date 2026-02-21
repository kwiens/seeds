import { relations } from "drizzle-orm";
import {
  doublePrecision,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Enums
export const categoryEnum = pgEnum("category", [
  "daily_access",
  "outdoor_play",
  "balanced_growth",
  "respect",
  "connected_communities",
]);

export const statusEnum = pgEnum("status", [
  "draft",
  "pending",
  "approved",
  "archived",
]);

export const roleEnum = pgEnum("role", ["user", "admin"]);

// Users
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

// Seeds
export const seeds = pgTable("seeds", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  summary: text("summary").notNull(),
  gardeners: jsonb("gardeners").$type<string[]>().notNull().default([]),
  locationAddress: text("location_address"),
  locationLat: doublePrecision("location_lat"),
  locationLng: doublePrecision("location_lng"),
  category: categoryEnum("category").notNull(),
  roots: jsonb("roots").$type<string[]>().notNull().default([]),
  supportPeople: jsonb("support_people").$type<string[]>().notNull().default([]),
  waterHave: jsonb("water_have").$type<string[]>().notNull().default([]),
  waterNeed: jsonb("water_need").$type<string[]>().notNull().default([]),
  imageUrl: text("image_url"),
  status: statusEnum("status").notNull().default("pending"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Seed Approvals
export const seedApprovals = pgTable("seed_approvals", {
  id: uuid("id").defaultRandom().primaryKey(),
  seedId: uuid("seed_id")
    .notNull()
    .references(() => seeds.id, { onDelete: "cascade" }),
  approvedBy: uuid("approved_by")
    .notNull()
    .references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Seed Supports (sunlight / upvotes)
export const seedSupports = pgTable(
  "seed_supports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    seedId: uuid("seed_id")
      .notNull()
      .references(() => seeds.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("seed_supports_unique").on(t.seedId, t.userId)],
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  seeds: many(seeds),
  supports: many(seedSupports),
  approvals: many(seedApprovals),
}));

export const seedsRelations = relations(seeds, ({ one, many }) => ({
  creator: one(users, { fields: [seeds.createdBy], references: [users.id] }),
  supports: many(seedSupports),
  approvals: many(seedApprovals),
}));

export const seedSupportsRelations = relations(seedSupports, ({ one }) => ({
  seed: one(seeds, {
    fields: [seedSupports.seedId],
    references: [seeds.id],
  }),
  user: one(users, {
    fields: [seedSupports.userId],
    references: [users.id],
  }),
}));

export const seedApprovalsRelations = relations(seedApprovals, ({ one }) => ({
  seed: one(seeds, {
    fields: [seedApprovals.seedId],
    references: [seeds.id],
  }),
  approver: one(users, {
    fields: [seedApprovals.approvedBy],
    references: [users.id],
  }),
}));
