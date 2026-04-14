import { pgTable, uuid, varchar, timestamp, foreignKey, text, unique, boolean, jsonb, integer, date, pgEnum } from "drizzle-orm/pg-core"
// import { sql } from "drizzle-orm"

export const attributeSource = pgEnum("attribute_source", ['api', 'email', 'mobile_sdk', 'web', 'manual', 'import'])
export const attributeType = pgEnum("attribute_type", ['string', 'number', 'boolean', 'date'])
export const campaignPriority = pgEnum("campaign_priority", ['low', 'medium', 'high', 'critical'])
export const campaignStatus = pgEnum("campaign_status", ['draft', 'scheduled', 'active', 'paused', 'completed'])
export const gender = pgEnum("gender", ['male', 'female', 'other', 'unknown'])
export const journeyEnrollmentStatus = pgEnum("journey_enrollment_status", ['active', 'completed', 'exited', 'failed'])
export const journeyExecutionStatus = pgEnum("journey_execution_status", ['pending', 'executing', 'completed', 'failed', 'skipped'])
export const journeyNodeType = pgEnum("journey_node_type", ['trigger', 'action_email', 'action_push', 'action_banner', 'action_webhook', 'condition', 'delay', 'split'])
export const journeyStatus = pgEnum("journey_status", ['draft', 'active', 'paused', 'completed', 'archived'])
export const segmentType = pgEnum("segment_type", ['static', 'dynamic'])


export const apiTokens = pgTable("api_tokens", {
	
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	tokenHash: varchar("token_hash", { length: 255 }).notNull(),
	prefix: varchar({ length: 10 }).notNull(),
	lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: 'string' }),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const segmentContacts = pgTable("segment_contacts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	segmentId: uuid("segment_id").notNull(),
	contactId: uuid("contact_id").notNull(),
	addedAt: timestamp("added_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.segmentId],
		foreignColumns: [segments.id],
		name: "segment_contacts_segment_id_segments_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.contactId],
		foreignColumns: [contacts.id],
		name: "segment_contacts_contact_id_contacts_id_fk"
	}).onDelete("cascade"),
]);

export const contactDevices = pgTable("contact_devices", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contactId: uuid("contact_id").notNull(),
	platform: varchar({ length: 50 }).notNull(),
	osVersion: varchar("os_version", { length: 50 }),
	appVersion: varchar("app_version", { length: 50 }),
	deviceModel: varchar("device_model", { length: 100 }),
	pushToken: text("push_token"),
	lastActiveAt: timestamp("last_active_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.contactId],
		foreignColumns: [contacts.id],
		name: "contact_devices_contact_id_contacts_id_fk"
	}).onDelete("cascade"),
]);

export const contactAttributes = pgTable("contact_attributes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	key: varchar({ length: 255 }).notNull(),
	label: varchar({ length: 255 }).notNull(),
	type: attributeType().notNull(),
	category: varchar({ length: 100 }).default('custom'),
	isDefault: boolean("is_default").default(false).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("contact_attributes_key_unique").on(table.key),
]);

export const contactEvents = pgTable("contact_events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contactId: uuid("contact_id").notNull(),
	eventTypeId: uuid("event_type_id").notNull(),
	properties: jsonb().default({}),
	source: attributeSource().default('api'),
	occurredAt: timestamp("occurred_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.contactId],
		foreignColumns: [contacts.id],
		name: "contact_events_contact_id_contacts_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.eventTypeId],
		foreignColumns: [eventTypes.id],
		name: "contact_events_event_type_id_event_types_id_fk"
	}),
]);

export const eventTypes = pgTable("event_types", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	key: varchar({ length: 255 }).notNull(),
	label: varchar({ length: 255 }).notNull(),
	category: varchar({ length: 100 }).default('custom'),
	isDefault: boolean("is_default").default(false).notNull(),
	description: text(),
	parameters: jsonb().default([]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("event_types_key_unique").on(table.key),
]);

export const campaigns = pgTable("campaigns", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	objective: varchar({ length: 255 }),
	status: campaignStatus().default('draft').notNull(),
	priority: campaignPriority().default('medium').notNull(),
	startDate: timestamp("start_date", { withTimezone: true, mode: 'string' }),
	endDate: timestamp("end_date", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const creatives = pgTable("creatives", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	campaignId: uuid("campaign_id").notNull(),
	type: varchar({ length: 50 }).notNull(),
	fileUrl: text("file_url").notNull(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	fileSize: integer("file_size"),
	mimeType: varchar("mime_type", { length: 100 }),
	clickUrl: text("click_url"),
	altText: varchar("alt_text", { length: 500 }),
	width: integer(),
	height: integer(),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.campaignId],
		foreignColumns: [campaigns.id],
		name: "creatives_campaign_id_campaigns_id_fk"
	}).onDelete("cascade"),
]);

export const contacts = pgTable("contacts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	externalId: varchar("external_id", { length: 255 }),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 50 }),
	firstName: varchar("first_name", { length: 255 }),
	lastName: varchar("last_name", { length: 255 }),
	birthday: date(),
	gender: gender().default('unknown'),
	language: varchar({ length: 10 }).default('id'),
	city: varchar({ length: 255 }),
	province: varchar({ length: 255 }),
	country: varchar({ length: 100 }).default('ID'),
	avatarUrl: text("avatar_url"),
	tags: jsonb().default([]),
	lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const contactCustomValues = pgTable("contact_custom_values", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contactId: uuid("contact_id").notNull(),
	attributeId: uuid("attribute_id").notNull(),
	value: text(),
	source: attributeSource().default('manual'),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.contactId],
		foreignColumns: [contacts.id],
		name: "contact_custom_values_contact_id_contacts_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.attributeId],
		foreignColumns: [contactAttributes.id],
		name: "contact_custom_values_attribute_id_contact_attributes_id_fk"
	}).onDelete("cascade"),
]);

export const segments = pgTable("segments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	type: segmentType().notNull(),
	rules: jsonb(),
	tags: jsonb().default([]),
	contactCount: integer("contact_count").default(0),
	lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const emailTemplates = pgTable("email_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	subject: varchar({ length: 500 }).notNull(),
	bodyHtml: text("body_html").notNull(),
	bodyText: text("body_text"),
	variables: jsonb().default([]),
	category: varchar({ length: 100 }).default('general'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const journeys = pgTable("journeys", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	status: journeyStatus().default('draft').notNull(),
	triggerType: varchar("trigger_type", { length: 50 }).default('event').notNull(),
	triggerConfig: jsonb("trigger_config").default({}),
	segmentId: uuid("segment_id"),
	quietHoursStart: varchar("quiet_hours_start", { length: 5 }),
	quietHoursEnd: varchar("quiet_hours_end", { length: 5 }),
	rateLimitPerContact: integer("rate_limit_per_contact"),
	rateLimitWindow: varchar("rate_limit_window", { length: 20 }),
	enrollmentCount: integer("enrollment_count").default(0),
	completedCount: integer("completed_count").default(0),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.segmentId],
		foreignColumns: [segments.id],
		name: "journeys_segment_id_segments_id_fk"
	}),
]);

export const journeyEdges = pgTable("journey_edges", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	journeyId: uuid("journey_id").notNull(),
	sourceNodeId: uuid("source_node_id").notNull(),
	targetNodeId: uuid("target_node_id").notNull(),
	sourceHandle: varchar("source_handle", { length: 50 }),
	label: varchar({ length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.journeyId],
		foreignColumns: [journeys.id],
		name: "journey_edges_journey_id_journeys_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.sourceNodeId],
		foreignColumns: [journeyNodes.id],
		name: "journey_edges_source_node_id_journey_nodes_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.targetNodeId],
		foreignColumns: [journeyNodes.id],
		name: "journey_edges_target_node_id_journey_nodes_id_fk"
	}).onDelete("cascade"),
]);

export const journeyNodes = pgTable("journey_nodes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	journeyId: uuid("journey_id").notNull(),
	type: journeyNodeType().notNull(),
	label: varchar({ length: 255 }),
	config: jsonb().default({}),
	positionX: integer("position_x").default(0).notNull(),
	positionY: integer("position_y").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.journeyId],
		foreignColumns: [journeys.id],
		name: "journey_nodes_journey_id_journeys_id_fk"
	}).onDelete("cascade"),
]);

export const journeyEnrollments = pgTable("journey_enrollments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	journeyId: uuid("journey_id").notNull(),
	contactId: uuid("contact_id").notNull(),
	status: journeyEnrollmentStatus().default('active').notNull(),
	currentNodeId: uuid("current_node_id"),
	enrolledAt: timestamp("enrolled_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	exitedAt: timestamp("exited_at", { withTimezone: true, mode: 'string' }),
	exitReason: varchar("exit_reason", { length: 255 }),
	metadata: jsonb().default({}),
}, (table) => [
	foreignKey({
		columns: [table.journeyId],
		foreignColumns: [journeys.id],
		name: "journey_enrollments_journey_id_journeys_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.contactId],
		foreignColumns: [contacts.id],
		name: "journey_enrollments_contact_id_contacts_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.currentNodeId],
		foreignColumns: [journeyNodes.id],
		name: "journey_enrollments_current_node_id_journey_nodes_id_fk"
	}),
]);

export const journeyExecutions = pgTable("journey_executions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	enrollmentId: uuid("enrollment_id").notNull(),
	nodeId: uuid("node_id").notNull(),
	status: journeyExecutionStatus().default('pending').notNull(),
	result: jsonb(),
	error: text(),
	scheduledAt: timestamp("scheduled_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
		columns: [table.enrollmentId],
		foreignColumns: [journeyEnrollments.id],
		name: "journey_executions_enrollment_id_journey_enrollments_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.nodeId],
		foreignColumns: [journeyNodes.id],
		name: "journey_executions_node_id_journey_nodes_id_fk"
	}).onDelete("cascade"),
]);
