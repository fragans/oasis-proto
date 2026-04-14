import { eq, desc } from 'drizzle-orm'
import { contactEvents, eventTypes } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const contactId = getRouterParam(event, 'id')!
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const offset = (page - 1) * limit

  const rows = await db.query.contactEvents.findMany({
    where: eq(contactEvents.contactId, contactId),
    with: { eventType: true },
    orderBy: [desc(contactEvents.occurredAt)],
    limit,
    offset
  })

  return { events: rows, page, limit }
})
