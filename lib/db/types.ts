import type { seedApprovals, seeds, seedSupports, users } from "./schema";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Seed = typeof seeds.$inferSelect;
export type NewSeed = typeof seeds.$inferInsert;

export type SeedSupport = typeof seedSupports.$inferSelect;
export type NewSeedSupport = typeof seedSupports.$inferInsert;

export type SeedApproval = typeof seedApprovals.$inferSelect;
export type NewSeedApproval = typeof seedApprovals.$inferInsert;
