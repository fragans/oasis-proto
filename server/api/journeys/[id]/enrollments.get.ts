import { eq, and, sql, desc } from 'drizzle-orm'
import { journeyEnrollments, contacts } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!
  const query = getQuery(event)

  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const offset = (page - 1) * limit

  const conditions = [eq(journeyEnrollments.journeyId, id)]

  if (query.status) {
    conditions.push(eq(journeyEnrollments.status, query.status as any))
  }

  const where = and(...conditions)

  const [rows, countResult] = await Promise.all([
    db.select({
      enrollment: journeyEnrollments,
      contact: {
        id: contacts.id,
        email: contacts.email,
        firstName: contacts.firstName,
        lastName: contacts.lastName
      }
    })
      .from(journeyEnrollments)
      .leftJoin(contacts, eq(journeyEnrollments.contactId, contacts.id))
      .where(where)
      .orderBy(desc(journeyEnrollments.enrolledAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(journeyEnrollments).where(where)
  ])

  return {
    enrollments: rows.map(r => ({ ...r.enrollment, contact: r.contact })),
    total: Number(countResult[0]?.count ?? 0),
    page,
    limit
  }
})
