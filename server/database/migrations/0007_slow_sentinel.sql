ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "targeting" jsonb;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "goal" jsonb;