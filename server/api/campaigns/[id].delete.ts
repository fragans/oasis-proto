import { getOrganizationId } from '../../utils/organization'
import { eq, and } from 'drizzle-orm'
import { campaigns } from '../../database/schema'
import { syncOrganizationCampaignsToKV } from '../../utils/kv-sync'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!

  const organizationId = getOrganizationId(event)
  const where = organizationId
    ? and(eq(campaigns.id, id), eq(campaigns.organizationId, organizationId))
    : eq(campaigns.id, id)

  const campaign = await db.query.campaigns.findFirst({
    where: where,
    with: { creatives: true }
  })

  if (!campaign) {
    throw createError({ statusCode: 404, message: 'Campaign not found' })
  }

  // Re-sync KV if active or scheduled (removes from list)
  if (campaign.status === 'active' || campaign.status === 'scheduled') {
    await syncOrganizationCampaignsToKV(campaign.organizationId)
  }

  // Delete creative files from OBS
  for (const creative of campaign.creatives) {
    try {
      const key = creative.fileUrl.split('/').slice(-2).join('/')
      await deleteCreative(key)
    } catch {
      // Continue even if OBS delete fails
    }
  }

  // Cascade delete handles creatives
  await db.delete(campaigns).where(where)

  return { success: true }
})
