import { getOrganizationId, requireAdmin } from '../../utils/organization'
import { eq } from 'drizzle-orm'
import { campaigns } from '../../database/schema'
import { syncOrganizationCampaignsToKV } from '../../utils/kv-sync'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  const id = getRouterParam(event, 'id')!

  const organizationId = await getOrganizationId(event)

  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, id),
    with: { creatives: true }
  })

  if (!campaign) {
    throw createError({ statusCode: 404, message: `Campaign with ID ${id} not found.` })
  }

  const isAdmin = await isSuperAdmin(event)
  if (!isAdmin && organizationId && campaign.organizationId !== organizationId) {
    throw createError({
      statusCode: 403,
      message: `Organization mismatch. This campaign belongs to ${campaign.organizationId}.`
    })
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
  await db.delete(campaigns).where(eq(campaigns.id, id))

  return { success: true }
})
