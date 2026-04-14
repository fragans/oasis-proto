import { eq } from 'drizzle-orm'
import { journeys } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!

  const [journey] = await db.select().from(journeys).where(eq(journeys.id, id)).limit(1)

  if (!journey) {
    throw createError({ statusCode: 404, message: 'Journey not found' })
  }

  if (journey.status === 'active') {
    throw createError({ statusCode: 422, message: 'Cannot delete an active journey. Pause or complete it first.' })
  }

  await db.delete(journeys).where(eq(journeys.id, id))

  return { success: true }
})
