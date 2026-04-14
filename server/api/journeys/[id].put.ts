import { eq } from 'drizzle-orm'
import { journeys } from '../../database/schema'
import { updateJourneySchema } from '~~/shared/types/journey'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const parsed = updateJourneySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 422, message: 'Validation failed', data: parsed.error.flatten() })
  }

  const [existing] = await db.select().from(journeys).where(eq(journeys.id, id)).limit(1)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Journey not found' })
  }

  if (existing.status !== 'draft') {
    throw createError({ statusCode: 422, message: 'Only draft journeys can be edited' })
  }

  const [updated] = await db.update(journeys)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(journeys.id, id))
    .returning()

  return updated
})
