CREATE TABLE "tenants" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"hostname" varchar(255) NOT NULL,
	"cookie_name" varchar(255) DEFAULT 'oasis_guid' NOT NULL,
	"api_url" text NOT NULL,
	"auth_cookie_names" jsonb DEFAULT '[]'::jsonb,
	"is_live" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_hostname_unique" UNIQUE("hostname")
);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;