import { eq } from 'drizzle-orm'
import { campaigns, creatives } from '../../../database/schema'

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

  // Create cloned campaign as draft
  const result = await db.insert(campaigns).values({
    tenantId: campaign.tenantId,
    name: `${campaign.name} (Copy)`,
    description: campaign.description,
    objective: campaign.objective,
    priority: campaign.priority,
    status: 'draft',
    startDate: null,
    endDate: null
  }).returning()
  const cloned = result[0]!
  // Clone creatives
  if (campaign.creatives.length > 0) {
    await db.insert(creatives).values(
      campaign.creatives.map(c => ({
        tenantId: campaign.tenantId,
        campaignId: cloned.id,
        type: c.type,
        fileUrl: c.fileUrl,
        fileName: c.fileName,
        fileSize: c.fileSize,
        mimeType: c.mimeType,
        clickUrl: c.clickUrl,
        altText: c.altText,
        width: c.width,
        height: c.height,
        sortOrder: c.sortOrder
      }))
    )
  }

  setResponseStatus(event, 201)
  return cloned
})
