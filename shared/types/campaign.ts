import { z } from 'zod'

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed'
export type CampaignPriority = 'low' | 'medium' | 'high' | 'critical'
export type CampaignType = 'sticky' | 'in-article' | 'popup'
export type TriggerMode = 'immediate' | 'scroll' | 'exit-intent'
export type TemplateType = 'promo-code' | 'modal-with-cta-redirect'
export type DeviceType = 'mobile' | 'desktop' | 'tablet'

export interface CampaignTrigger {
  mode: TriggerMode
  value?: number
}
export type TargetingRule
  = | { kind: 'geo', countries?: string[], cities?: string[], regions?: string[], boundingBox?: { latMin: number, latMax: number, lonMin: number, lonMax: number } }
    | { kind: 'device', types: DeviceType[] }
    | { kind: 'login', state: 'logged-in' | 'anonymous' }
    | { kind: 'page', match: 'equals' | 'starts-with' | 'contains' | 'regex', value: string }
    | { kind: 'gtm-attr', event?: string, key: string, op: 'equals' | 'contains', value: string }

export interface Targeting {
  operator: 'AND' | 'OR'
  rules: TargetingRule[]
}

export interface CampaignGoal {
  type: 'click'
  selector: string
  destinationUrl?: string
}

export interface Campaign {
  id: string
  tenantId: string
  name: string
  description: string | null
  objective: string | null
  status: CampaignStatus
  priority: CampaignPriority
  startDate: string | null
  endDate: string | null
  // Edge-worker delivery fields
  templateType: string | null
  campaignType: CampaignType
  elementSelector: string | null
  html: string | null
  trigger: CampaignTrigger | null
  segment: string | null
  targeting: Targeting | null
  goal: CampaignGoal | null
  isTestMode: boolean
  createdAt: string
  updatedAt: string
}

export interface Creative {
  id: string
  campaignId: string
  type: string
  fileUrl: string
  fileName: string
  fileSize: number | null
  mimeType: string | null
  clickUrl: string | null
  altText: string | null
  width: number | null
  height: number | null
  sortOrder: number | null
  createdAt: string
}

export interface CampaignWithCreatives extends Campaign {
  creatives: Creative[]
}

export interface CampaignListQuery {
  status?: CampaignStatus
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CampaignListResponse {
  campaigns: Campaign[]
  total: number
  page: number
  limit: number
}

// ─── KV Edge Payload (matches oasis-edge Campaign type) ─────────────────────────

export interface KVCampaign {
  id: string
  type: CampaignType
  trigger: CampaignTrigger
  segment: string | null
  targeting: Targeting | null
  goal: CampaignGoal | null
  element_selector: string
  html: string
  isTestMode: boolean
}

// ─── Predefined Campaign Templates ──────────────────────────────────────────────

export const CAMPAIGN_TEMPLATES: Record<TemplateType, {
  label: string
  description: string
  icon: string
  defaults: {
    campaignType: CampaignType
    elementSelector: string
    trigger: CampaignTrigger
    html: string
  }
}> = {
  'promo-code': {
    label: 'Promo Code',
    description: 'A floating banner with a discount code to drive conversions.',
    icon: 'i-lucide-tag',
    defaults: {
      campaignType: 'sticky',
      elementSelector: 'body',
      trigger: { mode: 'scroll', value: 30 },
      html: `
      <div class="oasis-banner" style="position: fixed;bottom: 24px;left: 50%;transform: translateX(-50%);background: #1a56db;color: #fff;padding: 16px 24px;border-radius: 20px;display: flex;align-items: center;gap: 16px;box-shadow: 0 10px 25px -5px rgba(26, 86, 219, 0.4);z-index: 9999;font-family: system-ui, -apple-system, sans-serif;min-width: 300px;border: 1px solid rgba(255,255,255,0.1);max-width: 320px;">
      <button onclick="this.getRootNode().host.style.display='none'" style="background: none; border: none; color: #fff; opacity: 0.6; cursor: pointer; padding: 4px; margin-left: 4px; font-size: 20px; line-height: 1;">&times;</button>
        <div style="flex: 1;">
          <p style="margin: 0;font-weight: 600;font-size: 15px;letter-spacing: -0.01em;padding-bottom: 4px;">{{promoTitle}}</p>
          <p style="margin: 0; font-size: 12px; opacity: 0.85;">{{promoDescription}}</p>
        </div>
        <a href="{{ctaLink}}" data-oasis-goal="click" style="background: #fff; color: #1a56db; padding: 10px 20px; border-radius: 99px; text-decoration: none; font-weight: 700; font-size: 13px; white-space: nowrap; transition: transform 0.2s ease;">
          {{ctaLabel}}
        </a>
      </div>
      `
    }
  },

  'modal-with-cta-redirect': {
    label: 'Modal with CTA',
    description: 'A large centered modal with a custom background and a call-to-action button.',
    icon: 'i-lucide-layout-template',
    defaults: {
      campaignType: 'popup',
      elementSelector: 'body',
      trigger: { mode: 'immediate' },
      html: `<div class="oasis-modal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; font-family: system-ui, -apple-system, sans-serif;">
  <div style="background: #fff; width: 100%; max-width: 320px; border-radius: 24px; overflow: hidden; position: relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
    <div style="height: 240px; background-image: url('{{creativeUrl}}'); background-size: cover; background-position: center; background-color: #f3f4f6;"></div>
    <div style="padding: 32px; text-align: center;">
      <h3 style="margin: 0 0 12px; font-size: 24px; font-weight: 800; color: #111827;">{{title}}</h3>
      <p style="margin: 0 0 24px; font-size: 16px; color: #4b5563; line-height: 1.5;">{{description}}</p>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <a href="{{ctaLink}}" data-oasis-goal="click" style="display: block; width: 100%; padding: 16px; background: #1a56db; color: #fff; border: none; border-radius: 12px; cursor: pointer; font-size: 16px; font-weight: 700; transition: background 0.2s; text-decoration: none; box-sizing: border-box;">{{ctaPositive}}</a>
        <button onclick="this.getRootNode().host.style.display='none'" style="width: 100%; padding: 12px; background: transparent; color: #6b7280; border: none; cursor: pointer; font-size: 14px; font-weight: 500;">{{ctaNegative}}</button>
      </div>
    </div>
    <button onclick="this.getRootNode().host.style.display='none'" style="position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,0.1); border: none; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px;">&times;</button>
  </div>
</div>`
    }
  }
}

// ─── Zod Validation Schemas ──────────────────────────────────────────────────────

export const targetingRuleSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('geo'),
    countries: z.array(z.string()).optional(),
    cities: z.array(z.string()).optional(),
    regions: z.array(z.string()).optional(),
    boundingBox: z.object({
      latMin: z.number(),
      latMax: z.number(),
      lonMin: z.number(),
      lonMax: z.number()
    }).optional()
  }),
  z.object({
    kind: z.literal('device'),
    types: z.array(z.enum(['mobile', 'desktop', 'tablet']))
  }),
  z.object({
    kind: z.literal('login'),
    state: z.enum(['logged-in', 'anonymous'])
  }),
  z.object({
    kind: z.literal('page'),
    match: z.enum(['equals', 'starts-with', 'contains', 'regex']),
    value: z.string()
  }),
  z.object({
    kind: z.literal('gtm-attr'),
    event: z.string().optional(),
    key: z.string(),
    op: z.enum(['equals', 'contains']),
    value: z.string()
  })
])

export const targetingSchema = z.object({
  operator: z.enum(['AND', 'OR']).default('AND'),
  rules: z.array(targetingRuleSchema)
})

export const campaignGoalSchema = z.object({
  type: z.literal('click'),
  selector: z.string(),
  destinationUrl: z.string().optional()
})

export const campaignTriggerSchema = z.object({
  mode: z.enum(['immediate', 'scroll', 'exit-intent']),
  value: z.number().optional()
})

export const baseCampaignSchema = z.object({
  // Basic metadata
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  objective: z.string().max(255).nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  // Multi-tenant
  tenantId: z.string().min(1),
  // Edge-worker delivery fields
  templateType: z.enum(['promo-code', 'modal-with-cta-redirect']).nullable().optional(),
  campaignType: z.enum(['sticky', 'in-article', 'popup']),
  elementSelector: z.string().nullable().optional(),
  html: z.string().nullable().optional(),
  trigger: campaignTriggerSchema.nullable().optional(),
  segment: z.string().nullable().optional(), // null = show to all users
  targeting: targetingSchema.nullable().optional(),
  goal: campaignGoalSchema.nullable().optional(),
  isTestMode: z.boolean()
})

export const createCampaignSchema = baseCampaignSchema.extend({
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  campaignType: z.enum(['sticky', 'in-article', 'popup']).default('sticky'),
  isTestMode: z.boolean().default(true)
})

export const updateCampaignSchema = baseCampaignSchema.partial()

export const changeStatusSchema = z.object({
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed'])
})

export const bulkActionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  action: z.enum(['pause', 'resume', 'archive'])
})

export const STATUS_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ['scheduled', 'active'],
  scheduled: ['active', 'draft'],
  active: ['paused', 'completed'],
  paused: ['active', 'completed'],
  completed: []
}

export const STATUS_COLORS: Record<CampaignStatus, 'error' | 'neutral' | 'primary' | 'secondary' | 'success' | 'info' | 'warning'> = {
  active: 'success',
  scheduled: 'warning',
  draft: 'neutral',
  paused: 'error',
  completed: 'info'
}

export const STATUS_ICONS: Record<CampaignStatus, string> = {
  draft: 'i-lucide-file-edit',
  scheduled: 'i-lucide-clock',
  active: 'i-lucide-play-circle',
  paused: 'i-lucide-pause-circle',
  completed: 'i-lucide-check-circle'
}

export const PRIORITY_COLORS: Record<CampaignPriority, 'error' | 'neutral' | 'primary' | 'secondary' | 'success' | 'info' | 'warning'> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  critical: 'error'
}
