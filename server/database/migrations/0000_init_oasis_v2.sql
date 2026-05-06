CREATE TYPE "public"."attribute_source" AS ENUM('api', 'email', 'mobile_sdk', 'web', 'manual', 'import');--> statement-breakpoint
CREATE TYPE "public"."attribute_type" AS ENUM('string', 'number', 'boolean', 'date');--> statement-breakpoint
CREATE TYPE "public"."campaign_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'active', 'paused', 'completed');--> statement-breakpoint
CREATE TYPE "public"."campaign_type" AS ENUM('sticky', 'in-article', 'popup');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."journey_enrollment_status" AS ENUM('active', 'completed', 'exited', 'failed');--> statement-breakpoint
CREATE TYPE "public"."journey_execution_status" AS ENUM('pending', 'executing', 'completed', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."journey_node_type" AS ENUM('trigger', 'action_email', 'action_push', 'action_banner', 'action_webhook', 'condition', 'delay', 'split');--> statement-breakpoint
CREATE TYPE "public"."journey_status" AS ENUM('draft', 'active', 'paused', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."segment_type" AS ENUM('static', 'dynamic');--> statement-breakpoint
CREATE TYPE "public"."trigger_mode" AS ENUM('immediate', 'scroll', 'exit-intent');--> statement-breakpoint
CREATE TABLE "api_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"prefix" varchar(32) NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"objective" varchar(255),
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"priority" "campaign_priority" DEFAULT 'medium' NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"template_type" varchar(50),
	"campaign_type" "campaign_type" DEFAULT 'sticky' NOT NULL,
	"element_selector" text,
	"html" text,
	"trigger" jsonb,
	"segment" varchar(255),
	"targeting" jsonb,
	"goal" jsonb,
	"is_test_mode" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "creatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid,
	"organization_id" varchar(255),
	"type" varchar(50) NOT NULL,
	"file_url" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"click_url" text,
	"alt_text" varchar(500),
	"width" integer,
	"height" integer,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"body_html" text NOT NULL,
	"body_text" text,
	"variables" jsonb DEFAULT '[]'::jsonb,
	"category" varchar(100) DEFAULT 'general',
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
CREATE TABLE "journey_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journey_id" uuid NOT NULL,
	"source_node_id" uuid NOT NULL,
	"target_node_id" uuid NOT NULL,
	"source_handle" varchar(50),
	"label" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journey_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journey_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"status" "journey_enrollment_status" DEFAULT 'active' NOT NULL,
	"current_node_id" uuid,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"exited_at" timestamp with time zone,
	"exit_reason" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "journey_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"node_id" uuid NOT NULL,
	"status" "journey_execution_status" DEFAULT 'pending' NOT NULL,
	"result" jsonb,
	"error" text,
	"scheduled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "journey_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journey_id" uuid NOT NULL,
	"type" "journey_node_type" NOT NULL,
	"label" varchar(255),
	"config" jsonb DEFAULT '{}'::jsonb,
	"position_x" integer DEFAULT 0 NOT NULL,
	"position_y" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journeys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" "journey_status" DEFAULT 'draft' NOT NULL,
	"trigger_type" varchar(50) DEFAULT 'event' NOT NULL,
	"trigger_config" jsonb DEFAULT '{}'::jsonb,
	"segment_id" uuid,
	"quiet_hours_start" varchar(5),
	"quiet_hours_end" varchar(5),
	"rate_limit_per_contact" integer,
	"rate_limit_window" varchar(20),
	"enrollment_count" integer DEFAULT 0,
	"completed_count" integer DEFAULT 0,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"hostname" varchar(255) NOT NULL,
	"cookie_name" varchar(255) DEFAULT 'oasis_guid' NOT NULL,
	"api_url" text NOT NULL,
	"auth_cookie_names" jsonb DEFAULT '[]'::jsonb,
	"is_live" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_hostname_unique" UNIQUE("hostname")
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
	"category" varchar(50),
	"rules" jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"contact_count" integer DEFAULT 0,
	"last_refreshed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_custom_values" ADD CONSTRAINT "contact_custom_values_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_custom_values" ADD CONSTRAINT "contact_custom_values_attribute_id_contact_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."contact_attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_devices" ADD CONSTRAINT "contact_devices_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_events" ADD CONSTRAINT "contact_events_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_events" ADD CONSTRAINT "contact_events_event_type_id_event_types_id_fk" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatives" ADD CONSTRAINT "creatives_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatives" ADD CONSTRAINT "creatives_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_edges" ADD CONSTRAINT "journey_edges_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_edges" ADD CONSTRAINT "journey_edges_source_node_id_journey_nodes_id_fk" FOREIGN KEY ("source_node_id") REFERENCES "public"."journey_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_edges" ADD CONSTRAINT "journey_edges_target_node_id_journey_nodes_id_fk" FOREIGN KEY ("target_node_id") REFERENCES "public"."journey_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_enrollments" ADD CONSTRAINT "journey_enrollments_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_enrollments" ADD CONSTRAINT "journey_enrollments_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_enrollments" ADD CONSTRAINT "journey_enrollments_current_node_id_journey_nodes_id_fk" FOREIGN KEY ("current_node_id") REFERENCES "public"."journey_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_executions" ADD CONSTRAINT "journey_executions_enrollment_id_journey_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."journey_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_executions" ADD CONSTRAINT "journey_executions_node_id_journey_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."journey_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_nodes" ADD CONSTRAINT "journey_nodes_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_segment_id_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."segments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segment_contacts" ADD CONSTRAINT "segment_contacts_segment_id_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."segments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segment_contacts" ADD CONSTRAINT "segment_contacts_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;