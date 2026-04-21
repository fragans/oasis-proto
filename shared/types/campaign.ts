import { z } from 'zod'

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed'
export type CampaignPriority = 'low' | 'medium' | 'high' | 'critical'
export type CampaignType = 'sticky' | 'in-article' | 'popup'
export type TriggerMode = 'immediate' | 'scroll' | 'exit-intent'
export type TemplateType = 'coupon' | 'feedback_rating'

export interface CampaignTrigger {
  mode: TriggerMode
  value?: number
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
  coupon: {
    label: 'Coupon Banner',
    description: 'Bottom-center floating promo banner to drive subscriptions.',
    icon: 'i-lucide-tag',
    defaults: {
      campaignType: 'sticky',
      elementSelector: 'body',
      trigger: { mode: 'scroll', value: 30 },
      html: `<div class="oasis-banner" style="position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #1a56db; color: #fff; padding: 16px 24px; border-radius: 99px; display: flex; align-items: center; gap: 16px; box-shadow: 0 10px 25px -5px rgba(26, 86, 219, 0.4); z-index: 9999; font-family: system-ui, -apple-system, sans-serif; min-width: 400px; border: 1px solid rgba(255,255,255,0.1);">
  <div style="background: rgba(255,255,255,0.2); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">🎁</div>
  <div style="flex: 1;">
    <p style="margin: 0; font-weight: 600; font-size: 15px; letter-spacing: -0.01em;">Extra 50% OFF first month</p>
    <p style="margin: 0; font-size: 12px; opacity: 0.85;">Use code <strong>OASIS50</strong> • New subscribers only</p>
  </div>
  <a href="/subscribe" style="background: #fff; color: #1a56db; padding: 10px 20px; border-radius: 99px; text-decoration: none; font-weight: 700; font-size: 13px; white-space: nowrap; transition: transform 0.2s ease;">Claim Now</a>
  <button onclick="this.getRootNode().host.style.display='none'" style="background: none; border: none; color: #fff; opacity: 0.6; cursor: pointer; padding: 4px; margin-left: 4px; font-size: 20px; line-height: 1;">&times;</button>
</div>`
    }
  },
  feedback_rating: {
    label: 'Feedback Rating',
    description: 'Ask readers to rate their experience with a star widget.',
    icon: 'i-lucide-star',
    defaults: {
      campaignType: 'popup',
      elementSelector: 'body',
      trigger: { mode: 'scroll', value: 70 },
      html: `<div class="oasis-rating" style="position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #fff; color: #111827; padding: 28px; border-radius: 24px; width: 340px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid #f3f4f6; z-index: 9999; font-family: system-ui, -apple-system, sans-serif; text-align: center;">
  <button onclick="this.getRootNode().host.style.display='none'" style="position: absolute; top: 16px; right: 16px; background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 22px; line-height: 1;">&times;</button>
  <p style="font-weight: 700; margin: 0 0 8px; font-size: 19px; color: #111827; letter-spacing: -0.02em;">How was the read?</p>
  <p style="margin: 0 0 24px; font-size: 14px; color: #6b7280;">Your feedback helps us deliver better content.</p>
  <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 28px; font-size: 32px; cursor: pointer;">
    <style>
      .star { opacity: 0.4; transition: all 0.2s ease; }
      .star:hover { opacity: 1; transform: scale(1.2); }
    </style>
    <span class="star">⭐</span><span class="star">⭐</span><span class="star">⭐</span><span class="star">⭐</span><span class="star">⭐</span>
  </div>
  <button style="width: 100%; padding: 14px; background: #1a56db; color: #fff; border: none; border-radius: 14px; cursor: pointer; font-size: 15px; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(26, 86, 219, 0.2);">Submit Feedback</button>
</div>`
    }
  }
}

// ─── Zod Validation Schemas ──────────────────────────────────────────────────────

export const campaignTriggerSchema = z.object({
  mode: z.enum(['immediate', 'scroll', 'exit-intent']),
  value: z.number().optional()
})

export const createCampaignSchema = z.object({
  // Basic metadata
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  objective: z.string().max(255).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  // Multi-tenant
  tenantId: z.string().min(1).default('kompasid'),
  // Edge-worker delivery fields
  templateType: z.enum(['coupon', 'feedback_rating']).optional(),
  campaignType: z.enum(['sticky', 'in-article', 'popup']).default('sticky'),
  elementSelector: z.string().optional(),
  html: z.string().optional(),
  trigger: campaignTriggerSchema.optional(),
  segment: z.string().optional(), // null = show to all users
  isTestMode: z.boolean().default(false)
})

export const updateCampaignSchema = createCampaignSchema.partial()

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

export const STATUS_COLORS: Record<CampaignStatus, string> = {
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

export const PRIORITY_COLORS: Record<CampaignPriority, string> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  critical: 'error'
}
