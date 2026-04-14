import { ilike, and, sql, desc } from 'drizzle-orm'
import { segments } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)

  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const offset = (page - 1) * limit

  const conditions = []

  if (query.search) {
    conditions.push(ilike(segments.name, `%${query.search}%`))
  }

  if (query.type && query.type !== 'all') {
    conditions.push(sql`${segments.type} = ${query.type}`)
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [rows, countResult] = await Promise.all([
    db.select().from(segments).where(where).orderBy(desc(segments.updatedAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(segments).where(where)
  ])

  return {
    segments: rows,
    total: Number(countResult[0]?.count ?? 0),
    page,
    limit
  }
})
