DELETE FROM "seed_team_updates" AS "reply"
WHERE "reply"."parent_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "seed_team_updates" AS "parent"
    WHERE "parent"."id" = "reply"."parent_id"
  );--> statement-breakpoint
ALTER TABLE "seed_team_updates" ADD CONSTRAINT "seed_team_updates_parent_id_seed_team_updates_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."seed_team_updates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_seed_team_events_seed_starts" ON "seed_team_events" USING btree ("seed_id","starts_at");--> statement-breakpoint
CREATE INDEX "idx_seed_team_updates_seed_created" ON "seed_team_updates" USING btree ("seed_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_seed_team_updates_parent" ON "seed_team_updates" USING btree ("parent_id");
