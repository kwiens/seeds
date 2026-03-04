CREATE TYPE "public"."category" AS ENUM('daily_access', 'outdoor_play', 'balanced_growth', 'respect', 'connected_communities');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('draft', 'pending', 'approved', 'archived');--> statement-breakpoint
CREATE TABLE "admin_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"added_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_emails_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "seed_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seed_id" uuid NOT NULL,
	"approved_by" uuid NOT NULL,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seed_supports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seed_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seeds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"summary" text NOT NULL,
	"gardeners" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"location_address" text,
	"location_description" text,
	"location_lat" double precision,
	"location_lng" double precision,
	"category" "category" NOT NULL,
	"roots" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"support_people" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"water_have" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"water_need" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"budget" text,
	"obstacles" text,
	"image_url" text,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"image" text,
	"role" "role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "admin_emails" ADD CONSTRAINT "admin_emails_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_approvals" ADD CONSTRAINT "seed_approvals_seed_id_seeds_id_fk" FOREIGN KEY ("seed_id") REFERENCES "public"."seeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_approvals" ADD CONSTRAINT "seed_approvals_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_supports" ADD CONSTRAINT "seed_supports_seed_id_seeds_id_fk" FOREIGN KEY ("seed_id") REFERENCES "public"."seeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_supports" ADD CONSTRAINT "seed_supports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seeds" ADD CONSTRAINT "seeds_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "seed_supports_unique" ON "seed_supports" USING btree ("seed_id","user_id");