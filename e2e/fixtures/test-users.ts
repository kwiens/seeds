export const e2eTestUsers = {
  admin: {
    email: "e2e-alice-admin@npcseeds.test",
    name: "E2E Alice Administrator",
    role: "admin",
    createdAt: new Date("2026-08-18T01:00:00.000Z"),
  },
  council: {
    email: "e2e-bob-council@npcseeds.test",
    name: "E2E Bob Council",
    role: "council",
    createdAt: new Date("2026-08-19T12:00:00.000Z"),
  },
  member: {
    email: "e2e-casey-member@npcseeds.test",
    name: "E2E Casey Member",
    role: "user",
    createdAt: new Date("2026-08-20T12:00:00.000Z"),
  },
} as const;

export type E2ETestUser = (typeof e2eTestUsers)[keyof typeof e2eTestUsers];
