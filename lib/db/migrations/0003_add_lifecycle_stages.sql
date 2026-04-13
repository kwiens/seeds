-- Add new lifecycle status values
ALTER TYPE "public"."status" ADD VALUE 'in_progress';
ALTER TYPE "public"."status" ADD VALUE 'in_maintenance';

-- Add badges JSONB column to seeds
ALTER TABLE "seeds" ADD COLUMN "badges" jsonb DEFAULT '[]'::jsonb NOT NULL;

-- GIN index for badge filtering performance
CREATE INDEX "idx_seeds_badges" ON "seeds" USING gin ("badges");

-- Site settings table for admin-configurable values
CREATE TABLE IF NOT EXISTS "site_settings" (
  "key" text PRIMARY KEY NOT NULL,
  "value" text NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Default homepage phase
INSERT INTO "site_settings" ("key", "value") VALUES ('homepage_phase', '1');
