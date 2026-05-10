import { getOrganizationId } from '../../utils/organization'
import { eq } from 'drizzle-orm'
import { campaigns } from '../../database/schema'
import { STATUS_TRANSITIONS } from '~~/shared/types/campaign'
import type { CampaignStatus } from '~~/shared/types/campaign'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!

  const organizationId = getOrganizationId(event)

  // Fetch by ID first to check existence
  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, id),
    with: { creatives: true }
  })

  if (!campaign) {
    throw createError({ statusCode: 404, message: `Campaign with ID ${id} not found in database.` })
  }

  // Then check organization context if enforced
  // Super Admins can bypass this check to view any campaign
  const isAdmin = isSuperAdmin(event)
  if (!isAdmin && organizationId && campaign.organizationId !== organizationId) {
    console.warn(`[GET /api/campaigns/${id}] Organization mismatch. Campaign belongs to ${campaign.organizationId}, but request context is ${organizationId}`)
    throw createError({
      statusCode: 403,
      message: `Organization mismatch. This campaign belongs to ${campaign.organizationId}.`
    })
  }

  const availableTransitions = STATUS_TRANSITIONS[campaign.status as CampaignStatus] || []
  const isEditable = campaign.status === 'draft' || campaign.status === 'scheduled'
  const daysRemaining = campaign.endDate
    ? Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return {
    ...campaign,
    availableTransitions,
    isEditable,
    daysRemaining
  }
})
