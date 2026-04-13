import { z } from 'zod'

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed'
export type CampaignPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Campaign {
  id: string
  name: string
  description: string | null
  objective: string | null
  status: CampaignStatus
  priority: CampaignPriority
  startDate: string | null
  endDate: string | null
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

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  objective: z.string().max(255).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
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
