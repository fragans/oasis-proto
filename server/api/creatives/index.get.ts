import { desc, eq } from 'drizzle-orm'
import { campaigns, creatives } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)
  const config = useRuntimeConfig()
  const tenantId = (query.tenantId as string) || (config.public.defaultTenantId as string)

  const rows = await db.select({
    id: creatives.id,
    campaignId: creatives.campaignId,
    type: creatives.type,
    fileUrl: creatives.fileUrl,
    fileName: creatives.fileName,
    fileSize: creatives.fileSize,
    mimeType: creatives.mimeType,
    createdAt: creatives.createdAt
  })
    .from(creatives)
    .innerJoin(campaigns, eq(creatives.campaignId, campaigns.id))
    .where(eq(campaigns.tenantId, tenantId))
    .orderBy(desc(creatives.createdAt))

  return { creatives: rows }
})
