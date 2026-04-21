DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attribute_source') THEN
        CREATE TYPE "public"."attribute_source" AS ENUM('api', 'email', 'mobile_sdk', 'web', 'manual', 'import');
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attribute_type') THEN
        CREATE TYPE "public"."attribute_type" AS ENUM('string', 'number', 'boolean', 'date');
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender') THEN
        CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other', 'unknown');
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'segment_type') THEN
        CREATE TYPE "public"."segment_type" AS ENUM('static', 'dynamic');
    END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"prefix" varchar(10) NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(255) NOT NULL,
	"label" varchar(255) NOT NULL,
	"type" "attribute_type" NOT NULL,
	"category" varchar(100) DEFAULT 'custom',
	"is_default" boolean DEFAULT false NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_attributes_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "contact_custom_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"attribute_id" uuid NOT NULL,
	"value" text,
	"source" "attribute_source" DEFAULT 'manual',
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"platform" varchar(50) NOT NULL,
	"os_version" varchar(50),
	"app_version" varchar(50),
	"device_model" varchar(100),
	"push_token" text,
	"last_active_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"event_type_id" uuid NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"source" "attribute_source" DEFAULT 'api',
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" varchar(255),
	"email" varchar(255),
	"phone" varchar(50),
	"first_name" varchar(255),
	"last_name" varchar(255),
	"birthday" date,
	"gender" "gender" DEFAULT 'unknown',
	"language" varchar(10) DEFAULT 'id',
	"city" varchar(255),
	"province" varchar(255),
	"country" varchar(100) DEFAULT 'ID',
	"avatar_url" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(255) NOT NULL,
	"label" varchar(255) NOT NULL,
	"category" varchar(100) DEFAULT 'custom',
	"is_default" boolean DEFAULT false NOT NULL,
	"description" text,
	"parameters" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_types_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "segment_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"segment_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "segment_type" NOT NULL,
	"rules" jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"contact_count" integer DEFAULT 0,
	"last_refreshed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_custom_values" ADD CONSTRAINT "contact_custom_values_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_custom_values" ADD CONSTRAINT "contact_custom_values_attribute_id_contact_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."contact_attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_devices" ADD CONSTRAINT "contact_devices_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_events" ADD CONSTRAINT "contact_events_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_events" ADD CONSTRAINT "contact_events_event_type_id_event_types_id_fk" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segment_contacts" ADD CONSTRAINT "segment_contacts_segment_id_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."segments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segment_contacts" ADD CONSTRAINT "segment_contacts_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;