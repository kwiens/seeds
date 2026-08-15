import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Database clients are created when query modules are imported. Point them at
// an intentionally unreachable local address so an incompletely mocked test
// can never fall through to a shared environment.
process.env.DATABASE_URL ??=
  "postgresql://test:test@127.0.0.1:1/seeds_test?sslmode=disable";

// Mock next/cache — used by all server actions
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

// Mock next/navigation — redirect() throws in Next.js
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
