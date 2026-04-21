import { eq } from 'drizzle-orm'
import { campaigns } from '../../../database/schema'
import { changeStatusSchema, STATUS_TRANSITIONS } from '~~/shared/types/campaign'
import type { CampaignStatus } from '~~/shared/types/campaign'
import { syncTenantCampaignsToKV } from '../../../utils/kv-sync'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const parsed = changeStatusSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Validation failed',
      data: parsed.error.flatten()
    })
  }

  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, id)
  })

  if (!campaign) {
    throw createError({ statusCode: 404, message: 'Campaign not found' })
  }

  const currentStatus = campaign.status as CampaignStatus
  const newStatus = parsed.data.status
  const allowed = STATUS_TRANSITIONS[currentStatus]

  if (!allowed.includes(newStatus)) {
    throw createError({
      statusCode: 422,
      message: `Cannot transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'none'}`
    })
  }

  // Validate scheduling requires a start date
  if (newStatus === 'scheduled' && !campaign.startDate) {
    throw createError({
      statusCode: 422,
      message: 'Cannot schedule a campaign without a start date'
    })
  }

  const [updated] = await db.update(campaigns)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(campaigns.id, id))
    .returning()

  // Sync tenant's campaign list to Cloudflare KV whenever active set changes
  const tenantId = campaign.tenantId || 'kompasid'
  if (newStatus === 'active' || newStatus === 'paused' || newStatus === 'completed') {
    await syncTenantCampaignsToKV(tenantId)
  }

  return updated
})
