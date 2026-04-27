import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { campaigns, creatives } from '../../../database/schema'

const createCreativeSchema = z.object({
  fileUrl: z.string().url(),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().nonnegative().optional(),
  mimeType: z.string().max(100).optional()
})

export default defineEventHandler(async (event) => {
  const db = useDB()
  const campaignId = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const parsed = createCreativeSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Validation failed',
      data: parsed.error.flatten()
    })
  }

  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, campaignId)
  })

  if (!campaign) {
    throw createError({ statusCode: 404, message: 'Campaign not found' })
  }

  const mimeType = parsed.data.mimeType || 'image/jpeg'
  const type = mimeType.startsWith('image/') ? 'image' : 'banner'

  const [creative] = await db.insert(creatives).values({
    campaignId,
    tenantId: campaign.tenantId,
    type,
    fileUrl: parsed.data.fileUrl,
    fileName: parsed.data.fileName,
    fileSize: parsed.data.fileSize ?? null,
    mimeType
  }).returning()

  setResponseStatus(event, 201)
  return creative
})
