import { z } from 'zod'

// ─── Journey Status ────────────────────────────────────────

export type JourneyStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'

export const JOURNEY_STATUS_TRANSITIONS: Record<JourneyStatus, JourneyStatus[]> = {
  draft: ['active'],
  active: ['paused', 'completed'],
  paused: ['active', 'completed', 'archived'],
  completed: ['archived'],
  archived: []
}

export const JOURNEY_STATUS_COLORS: Record<JourneyStatus, string> = {
  draft: 'neutral',
  active: 'success',
  paused: 'warning',
  completed: 'info',
  archived: 'neutral'
}

export const JOURNEY_STATUS_ICONS: Record<JourneyStatus, string> = {
  draft: 'i-lucide-file-edit',
  active: 'i-lucide-play-circle',
  paused: 'i-lucide-pause-circle',
  completed: 'i-lucide-check-circle',
  archived: 'i-lucide-archive'
}

// ─── Node Types ────────────────────────────────────────────

export type JourneyNodeType
  = | 'trigger'
    | 'action_email'
    | 'action_push'
    | 'action_banner'
    | 'action_webhook'
    | 'condition'
    | 'delay'
    | 'split'

export const NODE_TYPE_LABELS: Record<JourneyNodeType, string> = {
  trigger: 'Trigger',
  action_email: 'Send Email',
  action_push: 'Push Notification',
  action_banner: 'Web Banner',
  action_webhook: 'Webhook',
  condition: 'Condition',
  delay: 'Wait / Delay',
  split: 'A/B Split'
}

export const NODE_TYPE_ICONS: Record<JourneyNodeType, string> = {
  trigger: 'i-lucide-zap',
  action_email: 'i-lucide-mail',
  action_push: 'i-lucide-bell',
  action_banner: 'i-lucide-layout',
  action_webhook: 'i-lucide-webhook',
  condition: 'i-lucide-git-branch',
  delay: 'i-lucide-timer',
  split: 'i-lucide-split'
}

export const NODE_TYPE_COLORS: Record<JourneyNodeType, string> = {
  trigger: 'amber',
  action_email: 'blue',
  action_push: 'violet',
  action_banner: 'emerald',
  action_webhook: 'orange',
  condition: 'cyan',
  delay: 'zinc',
  split: 'pink'
}

// ─── Node Configs ──────────────────────────────────────────

export interface TriggerConfig {
  eventTypeId?: string
  eventKey?: string
  parameterFilters?: { key: string, operator: string, value: unknown }[]
  segmentId?: string
  schedule?: {
    type: 'once' | 'recurring'
    cron?: string
    date?: string
  }
}

export interface EmailActionConfig {
  templateId: string
  subject?: string
  fromName?: string
  fromEmail?: string
  replyTo?: string
  personalization?: Record<string, string>
}

export interface PushActionConfig {
  title: string
  body: string
  imageUrl?: string
  actionUrl?: string
  data?: Record<string, unknown>
}

export interface BannerActionConfig {
  campaignId?: string
  placement?: string
  duration?: number
}

export interface WebhookActionConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH'
  headers?: Record<string, string>
  body?: Record<string, unknown>
}

export interface ConditionConfig {
  type: 'attribute' | 'segment' | 'event' | 'engagement'
  field?: string
  operator?: string
  value?: unknown
  segmentId?: string
  eventKey?: string
}

export interface DelayConfig {
  type: 'duration' | 'until_date' | 'until_event'
  duration?: { value: number, unit: 'minutes' | 'hours' | 'days' | 'weeks' }
  untilDate?: string
  untilEventKey?: string
}

export interface SplitConfig {
  variants: { label: string, percentage: number }[]
}

export type NodeConfig
  = | TriggerConfig
    | EmailActionConfig
    | PushActionConfig
    | BannerActionConfig
    | WebhookActionConfig
    | ConditionConfig
    | DelayConfig
    | SplitConfig

// ─── Interfaces ────────────────────────────────────────────

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  bodyHtml: string
  bodyText: string | null
  variables: string[]
  category: string
  createdAt: string
  updatedAt: string
}

export interface JourneyNode {
  id: string
  journeyId: string
  type: JourneyNodeType
  label: string | null
  config: Record<string, unknown>
  positionX: number
  positionY: number
  createdAt: string
}

export interface JourneyEdge {
  id: string
  journeyId: string
  sourceNodeId: string
  targetNodeId: string
  sourceHandle: string | null
  label: string | null
  createdAt: string
}

export interface Journey {
  id: string
  name: string
  description: string | null
  status: JourneyStatus
  triggerType: string
  triggerConfig: Record<string, unknown>
  segmentId: string | null
  quietHoursStart: string | null
  quietHoursEnd: string | null
  rateLimitPerContact: number | null
  rateLimitWindow: string | null
  enrollmentCount: number
  completedCount: number
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface JourneyWithGraph extends Journey {
  nodes: JourneyNode[]
  edges: JourneyEdge[]
  segment?: { id: string, name: string } | null
}

export type EnrollmentStatus = 'active' | 'completed' | 'exited' | 'failed'
export type ExecutionStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'skipped'

export interface JourneyEnrollment {
  id: string
  journeyId: string
  contactId: string
  status: EnrollmentStatus
  currentNodeId: string | null
  enrolledAt: string
  completedAt: string | null
  exitedAt: string | null
  exitReason: string | null
  metadata: Record<string, unknown>
}

export interface JourneyExecution {
  id: string
  enrollmentId: string
  nodeId: string
  status: ExecutionStatus
  result: Record<string, unknown> | null
  error: string | null
  scheduledAt: string
  startedAt: string | null
  completedAt: string | null
}

// ─── List Responses ────────────────────────────────────────

export interface JourneyListResponse {
  journeys: Journey[]
  total: number
  page: number
  limit: number
}

export interface EmailTemplateListResponse {
  templates: EmailTemplate[]
  total: number
  page: number
  limit: number
}

// ─── Zod Schemas ───────────────────────────────────────────

export const createEmailTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  subject: z.string().min(1).max(500),
  bodyHtml: z.string().min(1),
  bodyText: z.string().optional(),
  variables: z.array(z.string()).default([]),
  category: z.string().max(100).default('general')
})

export const updateEmailTemplateSchema = createEmailTemplateSchema.partial()

export const createJourneySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  triggerType: z.enum(['event', 'segment', 'schedule', 'manual']).default('event'),
  triggerConfig: z.record(z.string(), z.unknown()).default({}),
  segmentId: z.string().uuid().optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  rateLimitPerContact: z.number().int().min(1).optional(),
  rateLimitWindow: z.enum(['hour', 'day', 'week', 'month']).optional()
})

export const updateJourneySchema = createJourneySchema.partial()

export const saveJourneyGraphSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    type: z.enum(['trigger', 'action_email', 'action_push', 'action_banner', 'action_webhook', 'condition', 'delay', 'split']),
    label: z.string().optional(),
    config: z.record(z.string(), z.unknown()).default({}),
    positionX: z.number(),
    positionY: z.number()
  })),
  edges: z.array(z.object({
    id: z.string(),
    sourceNodeId: z.string(),
    targetNodeId: z.string(),
    sourceHandle: z.string().optional(),
    label: z.string().optional()
  }))
})

export const changeJourneyStatusSchema = z.object({
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived'])
})

export const enrollContactsSchema = z.object({
  contactIds: z.array(z.string().uuid()).min(1).max(1000),
  metadata: z.record(z.string(), z.unknown()).optional()
})
