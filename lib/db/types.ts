import type {
  adminEmails,
  projectActivityReads,
  projectApprovals,
  projectBudgets,
  projectEvents,
  projectInvites,
  projectParticipants,
  projects,
  projectUpdates,
  users,
} from "./schema";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type ProjectParticipant = typeof projectParticipants.$inferSelect;
export type NewProjectParticipant = typeof projectParticipants.$inferInsert;

export type ProjectApproval = typeof projectApprovals.$inferSelect;
export type NewProjectApproval = typeof projectApprovals.$inferInsert;

export type ProjectUpdate = typeof projectUpdates.$inferSelect;
export type NewProjectUpdate = typeof projectUpdates.$inferInsert;

export type AdminEmail = typeof adminEmails.$inferSelect;
export type NewAdminEmail = typeof adminEmails.$inferInsert;

export type ProjectActivityRead = typeof projectActivityReads.$inferSelect;
export type NewProjectActivityRead = typeof projectActivityReads.$inferInsert;

export type Budget = typeof projectBudgets.$inferSelect;
export type NewBudget = typeof projectBudgets.$inferInsert;

export type ProjectEvent = typeof projectEvents.$inferSelect;
export type NewProjectEvent = typeof projectEvents.$inferInsert;

export type ProjectInvite = typeof projectInvites.$inferSelect;
export type NewProjectInvite = typeof projectInvites.$inferInsert;
