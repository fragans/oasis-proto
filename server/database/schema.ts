import { pgTable, pgEnum, uuid, varchar, text, integer, timestamp, boolean, jsonb, date } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'scheduled',
  'active',
  'paused',
  'completed'
])

export const campaignPriorityEnum = pgEnum('campaign_priority', [
  'low',
  'medium',
  'high',
  'critical'
])

export const campaignTypeEnum = pgEnum('campaign_type', [
  'sticky',
  'in-article',
  'popup'
])

export const triggerModeEnum = pgEnum('trigger_mode', [
  'immediate',
  'scroll',
  'exit-intent'
])

export const tenants = pgTable('tenants', {
  id: varchar('id', { length: 255 }).primaryKey(), // e.g. 'kompasid'
  hostname: varchar('hostname', { length: 255 }).notNull().unique(), // e.g. 'www.kompas.id'
  cookieName: varchar('cookie_name', { length: 255 }).notNull().default('oasis_guid'),
  apiUrl: text('api_url').notNull(),
  authCookieNames: jsonb('auth_cookie_names').$type<string[]>().default([]),
  isLive: boolean('is_live').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Multi-tenant scope
  tenantId: varchar('tenant_id', { length: 255 }).references(() => tenants.id, { onDelete: 'cascade' }).notNull().default('kompasid'),
  // Basic metadata
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  objective: varchar('objective', { length: 255 }),
  status: campaignStatusEnum('status').default('draft').notNull(),
  priority: campaignPriorityEnum('priority').default('medium').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  // Edge-worker delivery fields
  templateType: varchar('template_type', { length: 50 }),
  campaignType: campaignTypeEnum('campaign_type').default('sticky').notNull(),
  elementSelector: text('element_selector'),
  html: text('html'),
  trigger: jsonb('trigger').$type<{ mode: 'immediate' | 'scroll' | 'exit-intent', value?: number }>(),
  segment: varchar('segment', { length: 255 }),
  // Testing flag (oasis_test=1 gate per campaign)
  isTestMode: boolean('is_test_mode').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const creatives = pgTable('creatives', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  clickUrl: text('click_url'),
  altText: varchar('alt_text', { length: 500 }),
  width: integer('width'),
  height: integer('height'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const tenantsRelations = relations(tenants, ({ many }) => ({
  campaigns: many(campaigns)
}))

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [campaigns.tenantId],
    references: [tenants.id]
  }),
  creatives: many(creatives)
}))

export const creativesRelations = relations(creatives, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [creatives.campaignId],
    references: [campaigns.id]
  })
}))

// ─── CDP: Contacts ──────────────────────────────────────────

export const genderEnum = pgEnum('gender', ['male', 'female', 'other', 'unknown'])

export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalId: varchar('external_id', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  birthday: date('birthday'),
  gender: genderEnum('gender').default('unknown'),
  language: varchar('language', { length: 10 }).default('id'),
  city: varchar('city', { length: 255 }),
  province: varchar('province', { length: 255 }),
  country: varchar('country', { length: 100 }).default('ID'),
  avatarUrl: text('avatar_url'),
  tags: jsonb('tags').$type<string[]>().default([]),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const contactDevices = pgTable('contact_devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(),
  osVersion: varchar('os_version', { length: 50 }),
  appVersion: varchar('app_version', { length: 50 }),
  deviceModel: varchar('device_model', { length: 100 }),
  pushToken: text('push_token'),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

// ─── CDP: Attributes ────────────────────────────────────────

export const attributeTypeEnum = pgEnum('attribute_type', ['string', 'number', 'boolean', 'date'])
export const attributeSourceEnum = pgEnum('attribute_source', ['api', 'email', 'mobile_sdk', 'web', 'manual', 'import'])

export const contactAttributes = pgTable('contact_attributes', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  label: varchar('label', { length: 255 }).notNull(),
  type: attributeTypeEnum('type').notNull(),
  category: varchar('category', { length: 100 }).default('custom'),
  isDefault: boolean('is_default').default(false).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const contactCustomValues = pgTable('contact_custom_values', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }).notNull(),
  attributeId: uuid('attribute_id').references(() => contactAttributes.id, { onDelete: 'cascade' }).notNull(),
  value: text('value'),
  source: attributeSourceEnum('source').default('manual'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

// ─── CDP: Events ────────────────────────────────────────────

export const eventTypes = pgTable('event_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  label: varchar('label', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).default('custom'),
  isDefault: boolean('is_default').default(false).notNull(),
  description: text('description'),
  parameters: jsonb('parameters').$type<{ key: string, type: string, label: string }[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const contactEvents = pgTable('contact_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }).notNull(),
  eventTypeId: uuid('event_type_id').references(() => eventTypes.id).notNull(),
  properties: jsonb('properties').$type<Record<string, unknown>>().default({}),
  source: attributeSourceEnum('source').default('api'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

// ─── CDP: Segments ──────────────────────────────────────────

export const segmentTypeEnum = pgEnum('segment_type', ['static', 'dynamic'])

export const segments = pgTable('segments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: segmentTypeEnum('type').notNull(),
  category: varchar('category', { length: 50 }),
  rules: jsonb('rules').$type<Record<string, unknown>>(),
  tags: jsonb('tags').$type<string[]>().default([]),
  contactCount: integer('contact_count').default(0),
  lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const segmentContacts = pgTable('segment_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  segmentId: uuid('segment_id').references(() => segments.id, { onDelete: 'cascade' }).notNull(),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }).notNull(),
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull()
})

// ─── CDP: API Tokens ────────────────────────────────────────

export const apiTokens = pgTable('api_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  prefix: varchar('prefix', { length: 32 }).notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

// ─── CDP Relations ──────────────────────────────────────────

export const contactsRelations = relations(contacts, ({ many }) => ({
  devices: many(contactDevices),
  customValues: many(contactCustomValues),
  events: many(contactEvents),
  segmentMemberships: many(segmentContacts)
}))

export const contactDevicesRelations = relations(contactDevices, ({ one }) => ({
  contact: one(contacts, { fields: [contactDevices.contactId], references: [contacts.id] })
}))

export const contactCustomValuesRelations = relations(contactCustomValues, ({ one }) => ({
  contact: one(contacts, { fields: [contactCustomValues.contactId], references: [contacts.id] }),
  attribute: one(contactAttributes, { fields: [contactCustomValues.attributeId], references: [contactAttributes.id] })
}))

export const contactEventsRelations = relations(contactEvents, ({ one }) => ({
  contact: one(contacts, { fields: [contactEvents.contactId], references: [contacts.id] }),
  eventType: one(eventTypes, { fields: [contactEvents.eventTypeId], references: [eventTypes.id] })
}))

export const segmentsRelations = relations(segments, ({ many }) => ({
  contacts: many(segmentContacts)
}))

export const segmentContactsRelations = relations(segmentContacts, ({ one }) => ({
  segment: one(segments, { fields: [segmentContacts.segmentId], references: [segments.id] }),
  contact: one(contacts, { fields: [segmentContacts.contactId], references: [contacts.id] })
}))

// ─── Journey Orchestration ─────────────────────────────────

export const journeyStatusEnum = pgEnum('journey_status', [
  'draft',
  'active',
  'paused',
  'completed',
  'archived'
])

export const journeyNodeTypeEnum = pgEnum('journey_node_type', [
  'trigger',
  'action_email',
  'action_push',
  'action_banner',
  'action_webhook',
  'condition',
  'delay',
  'split'
])

export const journeyEnrollmentStatusEnum = pgEnum('journey_enrollment_status', [
  'active',
  'completed',
  'exited',
  'failed'
])

export const journeyExecutionStatusEnum = pgEnum('journey_execution_status', [
  'pending',
  'executing',
  'completed',
  'failed',
  'skipped'
])

export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  bodyHtml: text('body_html').notNull(),
  bodyText: text('body_text'),
  variables: jsonb('variables').$type<string[]>().default([]),
  category: varchar('category', { length: 100 }).default('general'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const journeys = pgTable('journeys', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: journeyStatusEnum('status').default('draft').notNull(),
  triggerType: varchar('trigger_type', { length: 50 }).notNull().default('event'),
  triggerConfig: jsonb('trigger_config').$type<Record<string, unknown>>().default({}),
  segmentId: uuid('segment_id').references(() => segments.id),
  quietHoursStart: varchar('quiet_hours_start', { length: 5 }),
  quietHoursEnd: varchar('quiet_hours_end', { length: 5 }),
  rateLimitPerContact: integer('rate_limit_per_contact'),
  rateLimitWindow: varchar('rate_limit_window', { length: 20 }),
  enrollmentCount: integer('enrollment_count').default(0),
  completedCount: integer('completed_count').default(0),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
})

export const journeyNodes = pgTable('journey_nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  journeyId: uuid('journey_id').references(() => journeys.id, { onDelete: 'cascade' }).notNull(),
  type: journeyNodeTypeEnum('type').notNull(),
  label: varchar('label', { length: 255 }),
  config: jsonb('config').$type<Record<string, unknown>>().default({}),
  positionX: integer('position_x').default(0).notNull(),
  positionY: integer('position_y').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const journeyEdges = pgTable('journey_edges', {
  id: uuid('id').primaryKey().defaultRandom(),
  journeyId: uuid('journey_id').references(() => journeys.id, { onDelete: 'cascade' }).notNull(),
  sourceNodeId: uuid('source_node_id').references(() => journeyNodes.id, { onDelete: 'cascade' }).notNull(),
  targetNodeId: uuid('target_node_id').references(() => journeyNodes.id, { onDelete: 'cascade' }).notNull(),
  sourceHandle: varchar('source_handle', { length: 50 }),
  label: varchar('label', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
})

export const journeyEnrollments = pgTable('journey_enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  journeyId: uuid('journey_id').references(() => journeys.id, { onDelete: 'cascade' }).notNull(),
  contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'cascade' }).notNull(),
  status: journeyEnrollmentStatusEnum('status').default('active').notNull(),
  currentNodeId: uuid('current_node_id').references(() => journeyNodes.id),
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  exitedAt: timestamp('exited_at', { withTimezone: true }),
  exitReason: varchar('exit_reason', { length: 255 }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({})
})

export const journeyExecutions = pgTable('journey_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  enrollmentId: uuid('enrollment_id').references(() => journeyEnrollments.id, { onDelete: 'cascade' }).notNull(),
  nodeId: uuid('node_id').references(() => journeyNodes.id, { onDelete: 'cascade' }).notNull(),
  status: journeyExecutionStatusEnum('status').default('pending').notNull(),
  result: jsonb('result').$type<Record<string, unknown>>(),
  error: text('error'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).defaultNow().notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true })
})

// ─── Journey Relations ─────────────────────────────────────

export const journeysRelations = relations(journeys, ({ one, many }) => ({
  segment: one(segments, { fields: [journeys.segmentId], references: [segments.id] }),
  nodes: many(journeyNodes),
  edges: many(journeyEdges),
  enrollments: many(journeyEnrollments)
}))

export const journeyNodesRelations = relations(journeyNodes, ({ one, many }) => ({
  journey: one(journeys, { fields: [journeyNodes.journeyId], references: [journeys.id] }),
  outgoingEdges: many(journeyEdges),
  executions: many(journeyExecutions)
}))

export const journeyEdgesRelations = relations(journeyEdges, ({ one }) => ({
  journey: one(journeys, { fields: [journeyEdges.journeyId], references: [journeys.id] }),
  sourceNode: one(journeyNodes, { fields: [journeyEdges.sourceNodeId], references: [journeyNodes.id] }),
  targetNode: one(journeyNodes, { fields: [journeyEdges.targetNodeId], references: [journeyNodes.id] })
}))

export const journeyEnrollmentsRelations = relations(journeyEnrollments, ({ one, many }) => ({
  journey: one(journeys, { fields: [journeyEnrollments.journeyId], references: [journeys.id] }),
  contact: one(contacts, { fields: [journeyEnrollments.contactId], references: [contacts.id] }),
  currentNode: one(journeyNodes, { fields: [journeyEnrollments.currentNodeId], references: [journeyNodes.id] }),
  executions: many(journeyExecutions)
}))

export const journeyExecutionsRelations = relations(journeyExecutions, ({ one }) => ({
  enrollment: one(journeyEnrollments, { fields: [journeyExecutions.enrollmentId], references: [journeyEnrollments.id] }),
  node: one(journeyNodes, { fields: [journeyExecutions.nodeId], references: [journeyNodes.id] })
}))
