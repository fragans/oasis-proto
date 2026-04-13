import { randomUUID } from 'node:crypto'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export default defineEventHandler(async (event) => {
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

  const ext = mimeType!.split('/')[1]!.replace('svg+xml', 'svg').replace('jpeg', 'jpg')
  const key = `creatives/${randomUUID()}.${ext}`

  const url = await uploadCreative(file.data as Buffer, key, mimeType)

  return {
    url,
    fileName: file.filename || `upload.${ext}`,
    fileSize: file.data.length,
    mimeType
  }
})
