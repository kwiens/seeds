CREATE TABLE "seed_team_file_deletions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seed_id" uuid NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seed_team_file_deletions_url_unique" UNIQUE("url")
);--> statement-breakpoint
CREATE FUNCTION "queue_seed_team_file_deletions"() RETURNS trigger AS $$
BEGIN
	INSERT INTO "seed_team_file_deletions" ("seed_id", "url")
	SELECT OLD."seed_id", "attachment"->>'url'
	FROM jsonb_array_elements(OLD."attachments") AS "attachment"
	WHERE "attachment" ? 'url'
	ON CONFLICT ("url") DO NOTHING;
	RETURN OLD;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER "seed_team_updates_queue_file_deletions"
BEFORE DELETE ON "seed_team_updates"
FOR EACH ROW EXECUTE FUNCTION "queue_seed_team_file_deletions"();
