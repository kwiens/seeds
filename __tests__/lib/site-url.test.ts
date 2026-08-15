import { beforeEach, describe, expect, it, vi } from "vitest";
import { headers } from "next/headers";
import { CANONICAL_ORIGIN, getRequestOrigin } from "@/lib/site-url";

vi.mock("next/headers", () => ({ headers: vi.fn() }));

function mockRequestHeaders(entries: Record<string, string>) {
  vi.mocked(headers).mockResolvedValue(
    new Headers(entries) as unknown as Awaited<ReturnType<typeof headers>>,
  );
}

describe("getRequestOrigin", () => {
  beforeEach(() => {
    vi.mocked(headers).mockReset();
  });

  it("builds the origin from forwarded headers on hosted deployments", async () => {
    mockRequestHeaders({
      "x-forwarded-host": "seeds-cha.vercel.app",
      "x-forwarded-proto": "https",
      host: "127.0.0.1:3000",
    });
    expect(await getRequestOrigin()).toBe("https://seeds-cha.vercel.app");
  });

  it("uses http for localhost when no forwarded protocol is present", async () => {
    mockRequestHeaders({ host: "localhost:3000" });
    expect(await getRequestOrigin()).toBe("http://localhost:3000");
  });

  it("falls back to the canonical origin outside a request scope", async () => {
    vi.mocked(headers).mockRejectedValue(
      new Error("headers was called outside a request scope"),
    );
    expect(await getRequestOrigin()).toBe(CANONICAL_ORIGIN);
  });
});
