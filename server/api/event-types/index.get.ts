import { asc, sql } from 'drizzle-orm'
import { eventTypes } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)

  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const offset = (page - 1) * limit

  const [rows, countResult] = await Promise.all([
    db.select().from(eventTypes).orderBy(asc(eventTypes.category), asc(eventTypes.label)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(eventTypes)
  ])
  return {
    eventTypes: rows,
    total: Number(countResult[0]?.count ?? 0),
    page,
    limit
  }
})
