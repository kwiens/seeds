CREATE TYPE "public"."budget_status" AS ENUM('proposed', 'final');--> statement-breakpoint
CREATE TABLE "seed_budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seed_id" uuid NOT NULL,
	"status" "budget_status" NOT NULL,
	"line_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seed_budgets" ADD CONSTRAINT "seed_budgets_seed_id_seeds_id_fk" FOREIGN KEY ("seed_id") REFERENCES "public"."seeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_budgets" ADD CONSTRAINT "seed_budgets_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "seed_budgets_unique" ON "seed_budgets" USING btree ("seed_id","status");