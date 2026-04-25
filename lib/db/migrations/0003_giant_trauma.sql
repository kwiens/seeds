ALTER TYPE "public"."status" ADD VALUE 'in_progress' BEFORE 'archived';--> statement-breakpoint
ALTER TYPE "public"."status" ADD VALUE 'in_maintenance' BEFORE 'archived';--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seeds" ADD COLUMN "badges" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_seeds_badges" ON "seeds" USING gin ("badges");--> statement-breakpoint
INSERT INTO "site_settings" ("key", "value") VALUES ('homepage_phase', '1') ON CONFLICT ("key") DO NOTHING;