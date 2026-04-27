import { desc, eq } from 'drizzle-orm'
import { creatives } from '../../database/schema'

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
    .where(eq(creatives.tenantId, tenantId))
    .orderBy(desc(creatives.createdAt))

  return { creatives: rows }
})
