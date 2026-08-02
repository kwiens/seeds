import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { describe, expect, it } from "vitest";
import * as schema from "@/lib/db/schema";

describe("schema relations", () => {
  it("compiles both user relations for a team membership", () => {
    const client = neon("postgresql://user:password@localhost/database");
    const testDb = drizzle(client, { schema });

    expect(() =>
      testDb.query.seedTeamMembers
        .findMany({ with: { user: true, addedByUser: true } })
        .toSQL(),
    ).not.toThrow();
  });
});
