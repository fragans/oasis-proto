CREATE TYPE "public"."campaign_type" AS ENUM('sticky', 'in-article', 'popup');--> statement-breakpoint
CREATE TYPE "public"."trigger_mode" AS ENUM('immediate', 'scroll', 'exit-intent');--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "tenant_id" varchar(255) DEFAULT 'kompas' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "template_type" varchar(50);--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "campaign_type" "campaign_type" DEFAULT 'sticky' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "element_selector" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "html" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "trigger" jsonb;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "segment" varchar(255);--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "is_test_mode" boolean DEFAULT false NOT NULL;