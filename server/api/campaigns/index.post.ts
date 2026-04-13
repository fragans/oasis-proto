import { campaigns } from '../../database/schema'
import { createCampaignSchema } from '~~/shared/types/campaign'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)

  const parsed = createCampaignSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Validation failed',
      data: parsed.error.flatten()
    })
  }

  const [campaign] = await db.insert(campaigns).values({
    name: parsed.data.name,
    description: parsed.data.description || null,
    objective: parsed.data.objective || null,
    priority: parsed.data.priority,
    startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
    endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null
  }).returning()

  setResponseStatus(event, 201)
  return campaign
})
