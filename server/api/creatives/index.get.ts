import { desc, eq } from 'drizzle-orm'
import { creatives } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)
  // 1. Resolve organizationId (Priority: Query > Session)
  const organizationId = (query.organizationId as string) || await getOrganizationId(event)

  // 2. Validate context (Super Admins can skip, others get 400)
  if (!organizationId && !(await isSuperAdmin(event))) {
    throw createError({
      statusCode: 400,
      message: 'Organization ID is required to fetch creatives.'
    })
  }

  // 3. Define filter (If no ID, fetch all for Super Admin Global View)
  const filter = organizationId ? eq(creatives.organizationId, organizationId) : undefined

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
    .where(filter)
    .orderBy(desc(creatives.createdAt))

  return { creatives: rows }
})
