CREATE TABLE "project_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"project_id" uuid NOT NULL,
	"role" "participant_role" NOT NULL,
	"invited_name" text NOT NULL,
	"created_by" uuid NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by" uuid,
	"canceled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "project_invites" ADD CONSTRAINT "project_invites_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invites" ADD CONSTRAINT "project_invites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invites" ADD CONSTRAINT "project_invites_accepted_by_users_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_project_invites_project_pending" ON "project_invites" USING btree ("project_id") WHERE "project_invites"."accepted_at" is null and "project_invites"."canceled_at" is null;