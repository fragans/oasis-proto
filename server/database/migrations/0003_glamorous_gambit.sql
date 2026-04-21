ALTER TABLE "api_tokens" ALTER COLUMN "prefix" SET DATA TYPE varchar(32);--> statement-breakpoint
ALTER TABLE "segments" ADD COLUMN "category" varchar(50);