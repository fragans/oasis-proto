import { randomUUID } from 'node:crypto'
import { eq, and } from 'drizzle-orm'
import { campaigns, creatives } from '../../database/schema'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export default defineEventHandler(async (event) => {
  const db = useDB()
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const tenantId = (query.tenantId as string) || (config.public.defaultTenantId as string)

  const files = await readMultipartFormData(event)

  if (!files || files.length === 0) {
    throw createError({ statusCode: 400, message: 'No file uploaded' })
  }

  const file = files.find(f => f.name === 'file')
  if (!file || !file.data) {
    throw createError({ statusCode: 400, message: 'No file found in upload' })
  }

  const mimeType = file.type || 'application/octet-stream'
  if (!ALLOWED_TYPES.includes(mimeType)) {
    throw createError({
      statusCode: 400,
      message: `File type '${mimeType}' not allowed. Accepted: ${ALLOWED_TYPES.join(', ')}`
    })
  }

  if (file.data!.length > MAX_SIZE) {
    throw createError({
      statusCode: 400,
      message: `File too large. Maximum size: ${MAX_SIZE / 1024 / 1024}MB`
    })
  }

  // Resolve Campaign ID (required by schema)
  let campaignId = query.campaignId as string
  if (!campaignId) {
    // Look for a "Global Assets" campaign for this tenant
    const galleryCampaign = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.tenantId, tenantId),
        eq(campaigns.name, 'Global Creative Gallery')
      )
    })

    if (galleryCampaign) {
      campaignId = galleryCampaign.id
    } else {
      // Create a placeholder campaign for gallery assets
      const [newCampaign] = await db.insert(campaigns).values({
        tenantId,
        name: 'Global Creative Gallery',
        description: 'System-generated campaign to host gallery assets.',
        status: 'draft'
      }).returning()

      if (!newCampaign) {
        throw createError({
          statusCode: 500,
          message: 'Failed to create Global Creative Gallery campaign'
        })
      }
      campaignId = newCampaign.id
    }
  }

  const ext = mimeType!.split('/')[1]!.replace('svg+xml', 'svg').replace('jpeg', 'jpg')
  const key = `creatives/${randomUUID()}.${ext}`

  const url = await uploadCreative(file.data as Buffer, key, mimeType)

  // Save to database
  const [creative] = await db.insert(creatives).values({
    campaignId,
    type: 'image',
    fileUrl: url,
    fileName: file.filename || `upload.${ext}`,
    fileSize: file.data.length,
    mimeType
  }).returning()

  if (!creative) {
    throw createError({
      statusCode: 500,
      message: 'Failed to save creative to database'
    })
  }

  return creative
})
