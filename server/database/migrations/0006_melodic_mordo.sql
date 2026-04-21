ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "tenant_id" SET DEFAULT 'kompasid';--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;