import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve("lib/db/migrations/0013_project_aggregate.sql"),
  "utf8",
);

describe("project aggregate migration", () => {
  it("renames the permanent project identity rather than rebuilding it", () => {
    expect(migration).toContain('ALTER TABLE "seeds" RENAME TO "projects"');
    expect(migration).not.toContain('CREATE TABLE "projects"');
  });

  it("splits every legacy lifecycle value into stage and approval", () => {
    for (const state of [
      "draft",
      "pending",
      "approved",
      "in_progress",
      "in_maintenance",
      "archived",
    ]) {
      expect(migration).toContain(`WHEN '${state}'`);
    }
    expect(migration).toContain('"archived_at"');
  });

  it("uses the old update timestamp as the archived timestamp", () => {
    expect(migration).toContain(
      `WHEN "project"."status" = 'archived' THEN "project"."updated_at"`,
    );
  });

  it("keeps the early budget text as budget_estimate", () => {
    expect(migration).toContain('RENAME COLUMN "budget" TO "budget_estimate"');
    expect(migration).not.toMatch(
      /INSERT INTO "project_budgets"[\s\S]*"budget_estimate"/,
    );
  });

  it("backfills every legacy people source before dropping it", () => {
    for (const source of [
      "seed_supports",
      "seed_team_members",
      '"gardeners"',
      '"roots"',
      '"support_people"',
    ]) {
      expect(migration).toContain(source);
    }
    const lastParticipantInsert = migration.lastIndexOf(
      'INSERT INTO "project_participants"',
    );
    expect(lastParticipantInsert).toBeLessThan(
      migration.indexOf('DROP TABLE "seed_supports"'),
    );
    expect(lastParticipantInsert).toBeLessThan(
      migration.indexOf('DROP TABLE "seed_team_members"'),
    );
  });

  it("preserves participant state and permits multiple roles", () => {
    expect(migration).toContain("'supporter'::\"participant_role\"");
    expect(migration).toContain("'gardener'::\"participant_role\"");
    expect(migration).toContain("'prospective'::\"participant_state\"");
    expect(migration).toContain(
      '"project_id", "user_id", "role") WHERE "user_id" IS NOT NULL',
    );
  });

  it("copies both update sources with explicit visibility before dropping them", () => {
    const publicCopy = migration.indexOf(`'public'::"update_visibility"`);
    const teamCopy = migration.indexOf(`'team'::"update_visibility"`);
    expect(publicCopy).toBeGreaterThan(-1);
    expect(teamCopy).toBeGreaterThan(publicCopy);
    expect(teamCopy).toBeLessThan(
      migration.indexOf('DROP TABLE "seed_updates"'),
    );
    expect(teamCopy).toBeLessThan(
      migration.indexOf('DROP TABLE "seed_team_updates"'),
    );
  });

  it("retains update IDs and team reply parent IDs", () => {
    expect(migration).toContain(
      '"id", "project_id", "created_by", "visibility", "title", "body", "parent_id"',
    );
    expect(migration).toContain(
      '"project_updates_parent_id_project_updates_id_fk"',
    );
  });

  it("queues Blob cleanup only for team-visible attachments", () => {
    expect(migration).toContain(`IF OLD."visibility" = 'team' THEN`);
    expect(migration).toContain(
      'CREATE TRIGGER "project_updates_queue_file_deletions"',
    );
  });
});
