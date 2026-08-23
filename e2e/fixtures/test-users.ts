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

export const e2eDirectoryUsers = Array.from({ length: 21 }, (_, index) => {
  const sequence = String(index + 1).padStart(2, "0");

  return {
    email: `e2e-directory-page-user-${sequence}@npcseeds.test`,
    name: `E2E Directory Page User ${sequence}`,
    role: "user" as const,
    createdAt: new Date(Date.UTC(2026, 7, 1, 0, index)),
  };
});

export type E2ETestUser = (typeof e2eTestUsers)[keyof typeof e2eTestUsers];
