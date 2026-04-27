import { randomUUID } from 'node:crypto'
import { creatives } from '../../database/schema'

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

  // Campaign ID is now optional
  const campaignId = query.campaignId as string || null

  const ext = mimeType!.split('/')[1]!.replace('svg+xml', 'svg').replace('jpeg', 'jpg')
  const key = `creatives/${randomUUID()}.${ext}`

  const url = await uploadCreative(file.data as Buffer, key, mimeType)

  // Save to database
  const [creative] = await db.insert(creatives).values({
    tenantId,
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
