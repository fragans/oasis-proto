import { eq } from 'drizzle-orm'
import { eventTypes } from '../../database/schema'
import { updateEventTypeSchema } from '~~/shared/types/contact'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const parsed = updateEventTypeSchema.parse(body)

  const existing = await db.select().from(eventTypes).where(eq(eventTypes.id, id)).limit(1)
  if (!existing[0]) {
    throw createError({ statusCode: 404, message: 'Event type not found' })
  }
  if (existing[0].isDefault) {
    throw createError({ statusCode: 403, message: 'Cannot modify default event types' })
  }

  const [updated] = await db.update(eventTypes).set(parsed).where(eq(eventTypes.id, id)).returning()
  return updated
})
