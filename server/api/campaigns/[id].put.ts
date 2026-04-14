import { eq } from 'drizzle-orm'
import { campaigns } from '../../database/schema'
import { updateCampaignSchema } from '~~/shared/types/campaign'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const parsed = updateCampaignSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Validation failed',
      data: parsed.error.flatten()
    })
  }

  const existing = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, id)
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Campaign not found' })
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description
  if (parsed.data.objective !== undefined) updateData.objective = parsed.data.objective
  if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority
  if (parsed.data.startDate !== undefined) updateData.startDate = new Date(parsed.data.startDate)
  if (parsed.data.endDate !== undefined) updateData.endDate = new Date(parsed.data.endDate)

  const result = await db.update(campaigns)
    .set(updateData)
    .where(eq(campaigns.id, id))
    .returning()

  const updated = result[0]!

  if (updated.status === 'active') {
    await syncCampaignToRedis(id)
  }

  return updated
})
