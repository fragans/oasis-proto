import { eq, sql } from 'drizzle-orm'
import { segmentContacts, contacts } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const segmentId = getRouterParam(event, 'id')!
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const offset = (page - 1) * limit

  const rows = await db
    .select({
      id: contacts.id,
      email: contacts.email,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      phone: contacts.phone,
      createdAt: contacts.createdAt,
      addedAt: segmentContacts.addedAt
    })
    .from(segmentContacts)
    .innerJoin(contacts, eq(segmentContacts.contactId, contacts.id))
    .where(eq(segmentContacts.segmentId, segmentId))
    .limit(limit)
    .offset(offset)

  const [countResult] = await db.select({ count: sql<number>`count(*)` })
    .from(segmentContacts)
    .where(eq(segmentContacts.segmentId, segmentId))

  return {
    contacts: rows,
    total: Number(countResult.count),
    page,
    limit
  }
})
