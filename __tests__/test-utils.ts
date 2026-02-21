import { vi } from "vitest";

// --- Mock session factories ---

export function mockSession(overrides?: {
  id?: string;
  role?: string;
  email?: string;
  name?: string;
}) {
  return {
    user: {
      id: overrides?.id ?? "user-1",
      role: overrides?.role ?? "user",
      email: overrides?.email ?? "test@example.com",
      name: overrides?.name ?? "Test User",
    },
  };
}

export function mockAdminSession() {
  return mockSession({
    id: "admin-1",
    role: "admin",
    email: "admin@example.com",
    name: "Admin",
  });
}

// --- Mock seed data ---

export function mockSeed(overrides?: Record<string, unknown>) {
  return {
    id: "seed-1",
    name: "Community Garden",
    summary: "A garden for the neighborhood.",
    gardeners: ["Alice"],
    locationAddress: "123 Main St",
    locationLat: 35.0456,
    locationLng: -85.3097,
    category: "daily_access",
    roots: ["Org A"],
    supportPeople: ["Bob"],
    waterHave: ["Tools"],
    waterNeed: ["Seeds"],
    imageUrl: null,
    status: "pending" as const,
    createdBy: "user-1",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    creator: {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      image: null,
      role: "user",
      createdAt: new Date("2024-01-01"),
    },
    ...overrides,
  };
}

export function validSeedFormData(overrides?: Record<string, unknown>) {
  return {
    name: "Community Garden",
    summary: "A garden for the neighborhood.",
    category: "daily_access",
    gardeners: ["Alice"],
    roots: [],
    supportPeople: [],
    waterHave: ["Tools"],
    waterNeed: ["Seeds"],
    ...overrides,
  };
}

// --- DB chain mocking helpers ---

/**
 * Mock a db.insert(table).values({}).returning({}) chain.
 * Returns the mock so you can configure the final resolved value.
 */
export function mockDbInsertChain(returning: unknown[] = [{ id: "seed-1" }]) {
  const mockReturning = vi.fn().mockResolvedValue(returning);
  const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
  return { values: mockValues, _returning: mockReturning };
}

/**
 * Mock a db.insert(table).values({}) chain (no returning).
 */
export function mockDbInsertSimpleChain() {
  const mockValues = vi.fn().mockResolvedValue(undefined);
  return { values: mockValues };
}

/**
 * Mock a db.update(table).set({}).where() chain.
 */
export function mockDbUpdateChain() {
  const mockWhere = vi.fn().mockResolvedValue(undefined);
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
  return { set: mockSet, _where: mockWhere };
}

/**
 * Mock a db.delete(table).where() chain.
 */
export function mockDbDeleteChain() {
  const mockWhere = vi.fn().mockResolvedValue(undefined);
  return { where: mockWhere };
}
