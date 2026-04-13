TRUNCATE TABLE "seed_updates";--> statement-breakpoint
ALTER TABLE "seed_updates" ALTER COLUMN "body" SET DATA TYPE jsonb USING body::jsonb;