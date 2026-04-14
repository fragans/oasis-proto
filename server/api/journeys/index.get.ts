import { eq, ilike, and, sql, asc, desc } from 'drizzle-orm'
import { journeys } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)

  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const offset = (page - 1) * limit
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc'

  const conditions = []

  if (query.status && query.status !== 'all') {
    conditions.push(eq(journeys.status, query.status as any))
  }

  if (query.search) {
    conditions.push(ilike(journeys.name, `%${query.search}%`))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const orderBy = sortOrder === 'asc' ? asc(journeys.createdAt) : desc(journeys.createdAt)

  const [rows, countResult] = await Promise.all([
    db.select().from(journeys).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(journeys).where(where)
  ])

  return {
    journeys: rows,
    total: Number(countResult[0]?.count ?? 0),
    page,
    limit
  }
})
