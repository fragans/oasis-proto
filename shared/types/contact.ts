import { z } from 'zod'

// ─── Contact ────────────────────────────────────────────────

export type Gender = 'male' | 'female' | 'other' | 'unknown'

export interface Contact {
  id: string
  externalId: string | null
  email: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  birthday: string | null
  gender: Gender
  language: string
  city: string | null
  province: string | null
  country: string
  avatarUrl: string | null
  tags: string[]
  lastSeenAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ContactDevice {
  id: string
  contactId: string
  platform: string
  osVersion: string | null
  appVersion: string | null
  deviceModel: string | null
  pushToken: string | null
  lastActiveAt: string | null
  createdAt: string
}

export interface ContactWithDetails extends Contact {
  devices: ContactDevice[]
  customValues: ContactCustomValue[]
  events: ContactEventWithType[]
  segments: { id: string, name: string }[]
}

// ─── Attributes ─────────────────────────────────────────────

export type AttributeType = 'string' | 'number' | 'boolean' | 'date'
export type AttributeSource = 'api' | 'email' | 'mobile_sdk' | 'web' | 'manual' | 'import'

export interface ContactAttribute {
  id: string
  key: string
  label: string
  type: AttributeType
  category: string
  isDefault: boolean
  description: string | null
  createdAt: string
}

export interface ContactCustomValue {
  id: string
  contactId: string
  attributeId: string
  value: string | null
  source: AttributeSource
  updatedAt: string
  attribute?: ContactAttribute
}

// ─── Events ─────────────────────────────────────────────────

export interface EventTypeParam {
  key: string
  type: string
  label: string
}

export interface EventType {
  id: string
  key: string
  label: string
  category: string
  isDefault: boolean
  description: string | null
  parameters: EventTypeParam[]
  createdAt: string
}

export interface ContactEvent {
  id: string
  contactId: string
  eventTypeId: string
  properties: Record<string, unknown>
  source: AttributeSource
  occurredAt: string
  createdAt: string
}

export interface ContactEventWithType extends ContactEvent {
  eventType: EventType
}

// ─── Segments ───────────────────────────────────────────────

export type SegmentType = 'static' | 'dynamic'

export type RuleOperator =
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains'
  | 'starts_with' | 'ends_with'
  | 'greater_than' | 'less_than'
  | 'is_set' | 'is_not_set'
  | 'in' | 'not_in'
  | 'before' | 'after'

export interface SegmentRule {
  field: string
  operator: RuleOperator
  value: unknown
}

export interface SegmentRuleGroup {
  logic: 'and' | 'or'
  rules: SegmentRule[]
}

export interface Segment {
  id: string
  name: string
  description: string | null
  type: SegmentType
  rules: SegmentRuleGroup | null
  tags: string[]
  contactCount: number
  lastRefreshedAt: string | null
  createdAt: string
  updatedAt: string
}

// ─── List Responses ─────────────────────────────────────────

export interface ContactListQuery {
  search?: string
  tags?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ContactListResponse {
  contacts: Contact[]
  total: number
  page: number
  limit: number
}

export interface SegmentListResponse {
  segments: Segment[]
  total: number
  page: number
  limit: number
}

// ─── Zod Schemas ────────────────────────────────────────────

export const createContactSchema = z.object({
  externalId: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  firstName: z.string().max(255).optional(),
  lastName: z.string().max(255).optional(),
  birthday: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown']).default('unknown'),
  language: z.string().max(10).default('id'),
  city: z.string().max(255).optional(),
  province: z.string().max(255).optional(),
  country: z.string().max(100).default('ID'),
  avatarUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([])
})

export const updateContactSchema = createContactSchema.partial()

export const createAttributeSchema = z.object({
  key: z.string().min(1).max(255).regex(/^[a-z][a-z0-9_]*$/, 'Key must be lowercase snake_case'),
  label: z.string().min(1).max(255),
  type: z.enum(['string', 'number', 'boolean', 'date']),
  category: z.string().max(100).default('custom'),
  description: z.string().optional()
})

export const updateAttributeSchema = z.object({
  label: z.string().min(1).max(255).optional(),
  category: z.string().max(100).optional(),
  description: z.string().optional()
})

export const createEventTypeSchema = z.object({
  key: z.string().min(1).max(255).regex(/^[a-z][a-z0-9_.]*$/, 'Key must be lowercase dot/snake notation'),
  label: z.string().min(1).max(255),
  category: z.string().max(100).default('custom'),
  description: z.string().optional(),
  parameters: z.array(z.object({
    key: z.string().min(1),
    type: z.enum(['string', 'number', 'boolean', 'date']),
    label: z.string().min(1)
  })).default([])
})

export const updateEventTypeSchema = z.object({
  label: z.string().min(1).max(255).optional(),
  category: z.string().max(100).optional(),
  description: z.string().optional(),
  parameters: z.array(z.object({
    key: z.string().min(1),
    type: z.enum(['string', 'number', 'boolean', 'date']),
    label: z.string().min(1)
  })).optional()
})

export const createSegmentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['static', 'dynamic']),
  rules: z.object({
    logic: z.enum(['and', 'or']),
    rules: z.array(z.object({
      field: z.string().min(1),
      operator: z.enum([
        'equals', 'not_equals', 'contains', 'not_contains',
        'starts_with', 'ends_with', 'greater_than', 'less_than',
        'is_set', 'is_not_set', 'in', 'not_in', 'before', 'after'
      ]),
      value: z.unknown()
    }))
  }).optional(),
  tags: z.array(z.string()).default([])
})

export const updateSegmentSchema = createSegmentSchema.partial()

export const ingestContactSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  contactId: z.string().uuid().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  events: z.array(z.object({
    event: z.string().min(1),
    properties: z.record(z.string(), z.unknown()).default({}),
    occurredAt: z.string().datetime().optional()
  })).optional(),
  segmentIds: z.array(z.string().uuid()).optional()
}).refine(
  data => data.email || data.phone || data.contactId,
  { message: 'At least one of email, phone, or contactId is required' }
)

export const bulkImportContactSchema = z.object({
  contacts: z.array(createContactSchema).min(1).max(5000)
})
