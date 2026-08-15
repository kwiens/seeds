CREATE TYPE "public"."team_role" AS ENUM('steward', 'co_gardener', 'guide', 'roots', 'cultivator');--> statement-breakpoint
ALTER TYPE "public"."role" ADD VALUE 'council';--> statement-breakpoint
CREATE TABLE "seed_team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seed_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "team_role" NOT NULL,
	"added_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seed_team_members" ADD CONSTRAINT "seed_team_members_seed_id_seeds_id_fk" FOREIGN KEY ("seed_id") REFERENCES "public"."seeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_team_members" ADD CONSTRAINT "seed_team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_team_members" ADD CONSTRAINT "seed_team_members_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "seed_team_members_unique" ON "seed_team_members" USING btree ("seed_id","user_id");