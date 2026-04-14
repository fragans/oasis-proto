import { ilike, sql, asc, desc } from 'drizzle-orm'
import { emailTemplates } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)

  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const offset = (page - 1) * limit
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc'

  const conditions = []

  if (query.search) {
    conditions.push(ilike(emailTemplates.name, `%${query.search}%`))
  }

  const where = conditions.length > 0 ? conditions[0] : undefined
  const orderBy = sortOrder === 'asc' ? asc(emailTemplates.createdAt) : desc(emailTemplates.createdAt)

  const [rows, countResult] = await Promise.all([
    db.select().from(emailTemplates).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(emailTemplates).where(where)
  ])

  return {
    templates: rows,
    total: Number(countResult[0]?.count ?? 0),
    page,
    limit
  }
})
