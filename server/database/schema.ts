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

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  objective: varchar('objective', { length: 255 }),
  status: campaignStatusEnum('status').default('draft').notNull(),
  priority: campaignPriorityEnum('priority').default('medium').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
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

export const campaignsRelations = relations(campaigns, ({ many }) => ({
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
  prefix: varchar('prefix', { length: 10 }).notNull(),
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
