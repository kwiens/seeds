import type {
  adminEmails,
  seedApprovals,
  seedBudgets,
  seeds,
  seedSupports,
  seedTeamActivityReads,
  seedTeamEvents,
  seedTeamMembers,
  seedTeamUpdates,
  seedUpdates,
  users,
} from "./schema";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Seed = typeof seeds.$inferSelect;
export type NewSeed = typeof seeds.$inferInsert;

export type SeedSupport = typeof seedSupports.$inferSelect;
export type NewSeedSupport = typeof seedSupports.$inferInsert;

export type SeedApproval = typeof seedApprovals.$inferSelect;
export type NewSeedApproval = typeof seedApprovals.$inferInsert;

export type SeedUpdate = typeof seedUpdates.$inferSelect;
export type NewSeedUpdate = typeof seedUpdates.$inferInsert;

export type AdminEmail = typeof adminEmails.$inferSelect;
export type NewAdminEmail = typeof adminEmails.$inferInsert;

export type TeamUpdate = typeof seedTeamUpdates.$inferSelect;
export type NewTeamUpdate = typeof seedTeamUpdates.$inferInsert;

export type TeamMember = typeof seedTeamMembers.$inferSelect;
export type NewTeamMember = typeof seedTeamMembers.$inferInsert;

export type TeamActivityRead = typeof seedTeamActivityReads.$inferSelect;
export type NewTeamActivityRead = typeof seedTeamActivityReads.$inferInsert;

export type Budget = typeof seedBudgets.$inferSelect;
export type NewBudget = typeof seedBudgets.$inferInsert;

export type TeamEvent = typeof seedTeamEvents.$inferSelect;
export type NewTeamEvent = typeof seedTeamEvents.$inferInsert;
