CREATE TYPE "public"."approval_state" AS ENUM('draft', 'pending', 'approved');--> statement-breakpoint
CREATE TYPE "public"."participant_role" AS ENUM('supporter', 'gardener', 'member', 'steward', 'co_gardener', 'guide', 'roots', 'cultivator');--> statement-breakpoint
CREATE TYPE "public"."participant_state" AS ENUM('prospective', 'invited', 'active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."project_stage" AS ENUM('seed', 'sprout', 'tree');--> statement-breakpoint
CREATE TYPE "public"."update_visibility" AS ENUM('public', 'team');--> statement-breakpoint

-- A project's identity is permanent. Rename the aggregate first so every
-- existing foreign key follows it automatically, then split lifecycle state.
ALTER TABLE "seeds" RENAME TO "projects";--> statement-breakpoint
ALTER TABLE "projects" RENAME COLUMN "budget" TO "budget_estimate";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "stage" "project_stage";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "approval_state" "approval_state";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint

UPDATE "projects" AS "project"
SET
	"stage" = CASE "project"."status"
		WHEN 'draft' THEN 'seed'::"project_stage"
		WHEN 'pending' THEN 'seed'::"project_stage"
		WHEN 'approved' THEN 'seed'::"project_stage"
		WHEN 'in_progress' THEN 'sprout'::"project_stage"
		WHEN 'in_maintenance' THEN 'tree'::"project_stage"
		WHEN 'archived' THEN 'seed'::"project_stage"
		ELSE 'seed'::"project_stage"
	END,
	"approval_state" = CASE "project"."status"
		WHEN 'draft' THEN 'draft'::"approval_state"
		WHEN 'pending' THEN 'pending'::"approval_state"
		WHEN 'approved' THEN 'approved'::"approval_state"
		WHEN 'in_progress' THEN 'approved'::"approval_state"
		WHEN 'in_maintenance' THEN 'approved'::"approval_state"
		WHEN 'archived' THEN CASE
			WHEN EXISTS (
				SELECT 1 FROM "seed_approvals" AS "approval"
				WHERE "approval"."seed_id" = "project"."id"
			) THEN 'approved'::"approval_state"
			ELSE 'pending'::"approval_state"
		END
		ELSE 'pending'::"approval_state"
	END,
	"archived_at" = CASE
		WHEN "project"."status" = 'archived' THEN "project"."updated_at"
		ELSE NULL
	END;--> statement-breakpoint

ALTER TABLE "projects" ALTER COLUMN "stage" SET DEFAULT 'seed';--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "stage" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "approval_state" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "approval_state" SET NOT NULL;--> statement-breakpoint

-- People, organizations, supporters, and the delivery team now share one
-- participant model. A person can hold several roles with independent state.
CREATE TABLE "project_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid,
	"display_name" text NOT NULL,
	"role" "participant_role" NOT NULL,
	"state" "participant_state" DEFAULT 'active' NOT NULL,
	"added_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_participants_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade,
	CONSTRAINT "project_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id"),
	CONSTRAINT "project_participants_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id")
);--> statement-breakpoint

CREATE UNIQUE INDEX "project_participants_user_role_unique" ON "project_participants" ("project_id", "user_id", "role") WHERE "user_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "project_participants_named_role_unique" ON "project_participants" ("project_id", "display_name", "role") WHERE "user_id" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_project_participants_project_state" ON "project_participants" ("project_id", "state");--> statement-breakpoint

-- Every creator is represented by an account-backed gardener row.
INSERT INTO "project_participants" (
	"project_id", "user_id", "display_name", "role", "state", "added_by", "created_at", "updated_at"
)
SELECT
	"project"."id",
	"project"."created_by",
	"creator"."name",
	'gardener'::"participant_role",
	'active'::"participant_state",
	"project"."created_by",
	"project"."created_at",
	"project"."updated_at"
FROM "projects" AS "project"
JOIN "users" AS "creator" ON "creator"."id" = "project"."created_by"
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- Preserve supporters as active participant roles.
INSERT INTO "project_participants" (
	"project_id", "user_id", "display_name", "role", "state", "added_by", "created_at", "updated_at"
)
SELECT
	"support"."seed_id",
	"support"."user_id",
	"supporter"."name",
	'supporter'::"participant_role",
	'active'::"participant_state",
	"support"."user_id",
	"support"."created_at",
	"support"."created_at"
FROM "seed_supports" AS "support"
JOIN "users" AS "supporter" ON "supporter"."id" = "support"."user_id"
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- Preserve account-backed team roles. The old enum values are all valid in
-- participant_role and are cast through text to the new enum.
INSERT INTO "project_participants" (
	"project_id", "user_id", "display_name", "role", "state", "added_by", "created_at", "updated_at"
)
SELECT
	"membership"."seed_id",
	"membership"."user_id",
	"member"."name",
	"membership"."role"::text::"participant_role",
	'active'::"participant_state",
	"membership"."added_by",
	"membership"."created_at",
	"membership"."created_at"
FROM "seed_team_members" AS "membership"
JOIN "users" AS "member" ON "member"."id" = "membership"."user_id"
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- Convert anonymous gardener names, excluding the creator already represented
-- by an account-backed row. DISTINCT ON mirrors the form's case-insensitive
-- de-duplication behavior before the unique indexes enforce future writes.
WITH "gardener_candidates" AS (
	SELECT
		"project"."id" AS "project_id",
		"project"."created_by" AS "added_by",
		"project"."created_at",
		"project"."updated_at",
		trim(CASE
			WHEN jsonb_typeof("item"."value") = 'string' THEN "item"."value" #>> '{}'
			ELSE coalesce("item"."value"->>'name', '')
		END) AS "display_name",
		"creator"."name" AS "creator_name"
	FROM "projects" AS "project"
	JOIN "users" AS "creator" ON "creator"."id" = "project"."created_by"
	CROSS JOIN LATERAL jsonb_array_elements(coalesce("project"."gardeners", '[]'::jsonb)) AS "item"("value")
)
INSERT INTO "project_participants" (
	"project_id", "display_name", "role", "state", "added_by", "created_at", "updated_at"
)
SELECT DISTINCT ON ("project_id", lower("display_name"))
	"project_id",
	"display_name",
	'gardener'::"participant_role",
	'active'::"participant_state",
	"added_by",
	"created_at",
	"updated_at"
FROM "gardener_candidates"
WHERE "display_name" <> '' AND lower("display_name") <> lower("creator_name")
ORDER BY "project_id", lower("display_name")
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- Roots keep their commitment as participant state.
WITH "root_candidates" AS (
	SELECT
		"project"."id" AS "project_id",
		"project"."created_by" AS "added_by",
		"project"."created_at",
		"project"."updated_at",
		trim(CASE
			WHEN jsonb_typeof("item"."value") = 'string' THEN "item"."value" #>> '{}'
			ELSE coalesce("item"."value"->>'name', '')
		END) AS "display_name",
		CASE
			WHEN jsonb_typeof("item"."value") = 'object'
				AND coalesce(("item"."value"->>'committed')::boolean, false)
			THEN 'active'::"participant_state"
			ELSE 'prospective'::"participant_state"
		END AS "state"
	FROM "projects" AS "project"
	CROSS JOIN LATERAL jsonb_array_elements(coalesce("project"."roots", '[]'::jsonb)) AS "item"("value")
)
INSERT INTO "project_participants" (
	"project_id", "display_name", "role", "state", "added_by", "created_at", "updated_at"
)
SELECT DISTINCT ON ("project_id", lower("display_name"))
	"project_id",
	"display_name",
	'roots'::"participant_role",
	"state",
	"added_by",
	"created_at",
	"updated_at"
FROM "root_candidates"
WHERE "display_name" <> ''
ORDER BY "project_id", lower("display_name"), CASE WHEN "state" = 'active' THEN 0 ELSE 1 END
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- Early guide/support-person names were prospective rather than confirmed
-- team access, so preserve them with prospective state.
WITH "guide_candidates" AS (
	SELECT
		"project"."id" AS "project_id",
		"project"."created_by" AS "added_by",
		"project"."created_at",
		"project"."updated_at",
		trim(CASE
			WHEN jsonb_typeof("item"."value") = 'string' THEN "item"."value" #>> '{}'
			ELSE coalesce("item"."value"->>'name', '')
		END) AS "display_name"
	FROM "projects" AS "project"
	CROSS JOIN LATERAL jsonb_array_elements(coalesce("project"."support_people", '[]'::jsonb)) AS "item"("value")
)
INSERT INTO "project_participants" (
	"project_id", "display_name", "role", "state", "added_by", "created_at", "updated_at"
)
SELECT DISTINCT ON ("project_id", lower("display_name"))
	"project_id",
	"display_name",
	'guide'::"participant_role",
	'prospective'::"participant_state",
	"added_by",
	"created_at",
	"updated_at"
FROM "guide_candidates"
WHERE "display_name" <> ''
ORDER BY "project_id", lower("display_name")
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- Public progress and private team discussion share one storage model. IDs are
-- preserved so URLs and reply parent references remain valid.
CREATE TABLE "project_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"visibility" "update_visibility" NOT NULL,
	"title" text,
	"body" jsonb NOT NULL,
	"parent_id" uuid,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_updates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade,
	CONSTRAINT "project_updates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id")
);--> statement-breakpoint

INSERT INTO "project_updates" (
	"id", "project_id", "created_by", "visibility", "title", "body", "photos", "attachments", "created_at", "updated_at"
)
SELECT
	"id", "seed_id", "created_by", 'public'::"update_visibility", "title", "body", "photos", '[]'::jsonb, "created_at", "updated_at"
FROM "seed_updates";--> statement-breakpoint

INSERT INTO "project_updates" (
	"id", "project_id", "created_by", "visibility", "title", "body", "parent_id", "photos", "attachments", "created_at", "updated_at"
)
SELECT
	"id", "seed_id", "user_id", 'team'::"update_visibility", "title", to_jsonb("body"), "parent_id", '[]'::jsonb, "attachments", "created_at", "created_at"
FROM "seed_team_updates";--> statement-breakpoint

DELETE FROM "project_updates" AS "reply"
WHERE "reply"."parent_id" IS NOT NULL
	AND NOT EXISTS (
		SELECT 1 FROM "project_updates" AS "parent"
		WHERE "parent"."id" = "reply"."parent_id"
	);--> statement-breakpoint

ALTER TABLE "project_updates" ADD CONSTRAINT "project_updates_parent_id_project_updates_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."project_updates"("id") ON DELETE cascade;--> statement-breakpoint
CREATE INDEX "idx_project_updates_project_visibility_created" ON "project_updates" ("project_id", "visibility", "created_at");--> statement-breakpoint
CREATE INDEX "idx_project_updates_parent" ON "project_updates" ("parent_id");--> statement-breakpoint

-- Rename the project-owned capability tables in place so their data and IDs
-- remain intact.
ALTER TABLE "seed_team_activity_reads" RENAME TO "project_activity_reads";--> statement-breakpoint
ALTER TABLE "seed_approvals" RENAME TO "project_approvals";--> statement-breakpoint
ALTER TABLE "seed_budgets" RENAME TO "project_budgets";--> statement-breakpoint
ALTER TABLE "seed_comments" RENAME TO "project_comments";--> statement-breakpoint
ALTER TABLE "seed_team_events" RENAME TO "project_events";--> statement-breakpoint
ALTER TABLE "seed_team_file_deletions" RENAME TO "project_update_file_deletions";--> statement-breakpoint

ALTER TABLE "project_activity_reads" RENAME COLUMN "seed_id" TO "project_id";--> statement-breakpoint
ALTER TABLE "project_approvals" RENAME COLUMN "seed_id" TO "project_id";--> statement-breakpoint
ALTER TABLE "project_budgets" RENAME COLUMN "seed_id" TO "project_id";--> statement-breakpoint
ALTER TABLE "project_comments" RENAME COLUMN "seed_id" TO "project_id";--> statement-breakpoint
ALTER TABLE "project_events" RENAME COLUMN "seed_id" TO "project_id";--> statement-breakpoint
ALTER TABLE "project_update_file_deletions" RENAME COLUMN "seed_id" TO "project_id";--> statement-breakpoint

ALTER TABLE "project_activity_reads" ADD COLUMN "visibility" "update_visibility" DEFAULT 'team' NOT NULL;--> statement-breakpoint

-- Align inherited constraint/index names and update the read-marker key for
-- the newly explicit visibility dimension.
ALTER TABLE "project_approvals" RENAME CONSTRAINT "seed_approvals_seed_id_seeds_id_fk" TO "project_approvals_project_id_projects_id_fk";--> statement-breakpoint
ALTER TABLE "project_approvals" RENAME CONSTRAINT "seed_approvals_approved_by_users_id_fk" TO "project_approvals_approved_by_users_id_fk";--> statement-breakpoint
ALTER TABLE "project_budgets" RENAME CONSTRAINT "seed_budgets_seed_id_seeds_id_fk" TO "project_budgets_project_id_projects_id_fk";--> statement-breakpoint
ALTER TABLE "project_budgets" RENAME CONSTRAINT "seed_budgets_updated_by_users_id_fk" TO "project_budgets_updated_by_users_id_fk";--> statement-breakpoint
ALTER TABLE "project_comments" RENAME CONSTRAINT "seed_comments_seed_id_seeds_id_fk" TO "project_comments_project_id_projects_id_fk";--> statement-breakpoint
ALTER TABLE "project_comments" RENAME CONSTRAINT "seed_comments_user_id_users_id_fk" TO "project_comments_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "project_activity_reads" RENAME CONSTRAINT "seed_team_activity_reads_seed_id_seeds_id_fk" TO "project_activity_reads_project_id_projects_id_fk";--> statement-breakpoint
ALTER TABLE "project_activity_reads" RENAME CONSTRAINT "seed_team_activity_reads_user_id_users_id_fk" TO "project_activity_reads_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "project_events" RENAME CONSTRAINT "seed_team_events_seed_id_seeds_id_fk" TO "project_events_project_id_projects_id_fk";--> statement-breakpoint
ALTER TABLE "project_events" RENAME CONSTRAINT "seed_team_events_created_by_users_id_fk" TO "project_events_created_by_users_id_fk";--> statement-breakpoint
ALTER TABLE "projects" RENAME CONSTRAINT "seeds_created_by_users_id_fk" TO "projects_created_by_users_id_fk";--> statement-breakpoint
ALTER TABLE "project_update_file_deletions" RENAME CONSTRAINT "seed_team_file_deletions_url_unique" TO "project_update_file_deletions_url_unique";--> statement-breakpoint

ALTER INDEX "seed_budgets_unique" RENAME TO "project_budgets_unique";--> statement-breakpoint
DROP INDEX "seed_team_activity_reads_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "project_activity_reads_unique" ON "project_activity_reads" ("project_id", "user_id", "visibility");--> statement-breakpoint
ALTER INDEX IF EXISTS "idx_seed_team_events_seed_starts" RENAME TO "idx_project_events_project_starts";--> statement-breakpoint
ALTER INDEX "idx_seeds_badges" RENAME TO "idx_projects_badges";--> statement-breakpoint
CREATE INDEX "idx_projects_stage_approval" ON "projects" ("stage", "approval_state");--> statement-breakpoint

UPDATE "project_comments" AS "reply"
SET "parent_id" = NULL
WHERE "reply"."parent_id" IS NOT NULL
	AND NOT EXISTS (
		SELECT 1 FROM "project_comments" AS "parent"
		WHERE "parent"."id" = "reply"."parent_id"
	);--> statement-breakpoint
ALTER TABLE "project_comments" ADD CONSTRAINT "project_comments_parent_id_project_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."project_comments"("id") ON DELETE cascade;--> statement-breakpoint

-- Replace the old private-file deletion trigger with a visibility-aware one.
DROP TRIGGER IF EXISTS "seed_team_updates_queue_file_deletions" ON "seed_team_updates";--> statement-breakpoint
DROP FUNCTION IF EXISTS "queue_seed_team_file_deletions"();--> statement-breakpoint
CREATE FUNCTION "queue_project_update_file_deletions"() RETURNS trigger AS $$
BEGIN
	IF OLD."visibility" = 'team' THEN
		INSERT INTO "project_update_file_deletions" ("project_id", "url")
		SELECT OLD."project_id", "attachment"->>'url'
		FROM jsonb_array_elements(OLD."attachments") AS "attachment"
		WHERE "attachment" ? 'url'
		ON CONFLICT ("url") DO NOTHING;
	END IF;
	RETURN OLD;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER "project_updates_queue_file_deletions"
BEFORE DELETE ON "project_updates"
FOR EACH ROW EXECUTE FUNCTION "queue_project_update_file_deletions"();--> statement-breakpoint

-- Data has been copied into the consolidated models; retire only the legacy
-- structures that are now redundant.
DROP TABLE "seed_supports";--> statement-breakpoint
DROP TABLE "seed_team_members";--> statement-breakpoint
DROP TABLE "seed_team_updates";--> statement-breakpoint
DROP TABLE "seed_updates";--> statement-breakpoint

ALTER TABLE "projects" DROP COLUMN "gardeners";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "roots";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "support_people";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "status";--> statement-breakpoint
DROP TYPE "public"."status";--> statement-breakpoint
DROP TYPE "public"."team_role";
