DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_type') THEN
        CREATE TYPE "public"."campaign_type" AS ENUM('sticky', 'in-article', 'popup');
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trigger_mode') THEN
        CREATE TYPE "public"."trigger_mode" AS ENUM('immediate', 'scroll', 'exit-intent');
    END IF;
END $$;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "tenant_id" varchar(255) DEFAULT 'kompas' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "template_type" varchar(50);--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "campaign_type" "campaign_type" DEFAULT 'sticky' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "element_selector" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "html" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "trigger" jsonb;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "segment" varchar(255);--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "is_test_mode" boolean DEFAULT false NOT NULL;