ALTER TABLE "projects" ALTER COLUMN "category" SET DATA TYPE text USING "category"::text;--> statement-breakpoint
DROP TYPE "public"."category";