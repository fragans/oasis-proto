CREATE TABLE "deployment_info" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commit_sha_short" varchar(40) NOT NULL,
	"commit_sha_full" varchar(40) NOT NULL,
	"branch" varchar(255) NOT NULL,
	"environment" varchar(50) NOT NULL,
	"pushed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "deployment_info_pushed_at_idx" on "deployment_info" ("pushed_at" DESC);
