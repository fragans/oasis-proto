DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_tenant_id_tenants_id_fk') THEN
        ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_tenant_id_tenants_id_fk";
    END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "tenant_id" SET DEFAULT 'kompasid';
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaigns_tenant_id_tenants_id_fk') THEN
        ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;