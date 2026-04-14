import { eq, sql } from 'drizzle-orm'
import { eventTypes, contactEvents } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!

  const existing = await db.select().from(eventTypes).where(eq(eventTypes.id, id)).limit(1)
  if (!existing[0]) {
    throw createError({ statusCode: 404, message: 'Event type not found' })
  }
  if (existing[0].isDefault) {
    throw createError({ statusCode: 403, message: 'Cannot delete default event types' })
  }

  const [usageCount] = await db.select({ count: sql<number>`count(*)` })
    .from(contactEvents)
    .where(eq(contactEvents.eventTypeId, id))
  const hasData = Number(usageCount.count) > 0

  if (hasData) {
    throw createError({
      statusCode: 409,
      message: `Cannot delete event type: ${usageCount.count} events exist. Remove events first.`
    })
  }

  await db.delete(eventTypes).where(eq(eventTypes.id, id))
  return { success: true }
})
