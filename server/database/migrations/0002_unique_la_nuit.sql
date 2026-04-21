DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'journey_enrollment_status') THEN
        CREATE TYPE "public"."journey_enrollment_status" AS ENUM('active', 'completed', 'exited', 'failed');
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'journey_execution_status') THEN
        CREATE TYPE "public"."journey_execution_status" AS ENUM('pending', 'executing', 'completed', 'failed', 'skipped');
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'journey_node_type') THEN
        CREATE TYPE "public"."journey_node_type" AS ENUM('trigger', 'action_email', 'action_push', 'action_banner', 'action_webhook', 'condition', 'delay', 'split');
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'journey_status') THEN
        CREATE TYPE "public"."journey_status" AS ENUM('draft', 'active', 'paused', 'completed', 'archived');
    END IF;
END $$;--> statement-breakpoint
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
ALTER TABLE "journey_edges" ADD CONSTRAINT "journey_edges_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_edges" ADD CONSTRAINT "journey_edges_source_node_id_journey_nodes_id_fk" FOREIGN KEY ("source_node_id") REFERENCES "public"."journey_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_edges" ADD CONSTRAINT "journey_edges_target_node_id_journey_nodes_id_fk" FOREIGN KEY ("target_node_id") REFERENCES "public"."journey_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_enrollments" ADD CONSTRAINT "journey_enrollments_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_enrollments" ADD CONSTRAINT "journey_enrollments_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_enrollments" ADD CONSTRAINT "journey_enrollments_current_node_id_journey_nodes_id_fk" FOREIGN KEY ("current_node_id") REFERENCES "public"."journey_nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_executions" ADD CONSTRAINT "journey_executions_enrollment_id_journey_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."journey_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_executions" ADD CONSTRAINT "journey_executions_node_id_journey_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."journey_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_nodes" ADD CONSTRAINT "journey_nodes_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_segment_id_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."segments"("id") ON DELETE no action ON UPDATE no action;