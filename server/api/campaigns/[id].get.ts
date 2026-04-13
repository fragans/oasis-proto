import { eq } from 'drizzle-orm'
import { campaigns } from '../../database/schema'
import { STATUS_TRANSITIONS } from '~~/shared/types/campaign'
import type { CampaignStatus } from '~~/shared/types/campaign'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!

  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, id),
    with: { creatives: true }
  })

  if (!campaign) {
    throw createError({ statusCode: 404, message: 'Campaign not found' })
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
