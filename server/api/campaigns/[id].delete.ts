import { eq } from 'drizzle-orm'
import { campaigns, creatives } from '../../database/schema'

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

  // Remove from Redis if active
  if (campaign.status === 'active') {
    await removeCampaignFromRedis(id)
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
