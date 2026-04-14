import { ilike, and, sql, asc, desc } from 'drizzle-orm'
import { contacts } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)

  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const offset = (page - 1) * limit
  const sortBy = (query.sortBy as string) || 'createdAt'
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc'

  const conditions = []

  if (query.search) {
    const term = `%${query.search}%`
    conditions.push(
      sql`(${ilike(contacts.email, term)} OR ${ilike(contacts.firstName, term)} OR ${ilike(contacts.lastName, term)} OR ${ilike(contacts.phone, term)})`
    )
  }

  if (query.tags) {
    const tagList = (query.tags as string).split(',')
    conditions.push(sql`${contacts.tags} ?| array[${sql.join(tagList.map(t => sql`${t}`), sql`, `)}]`)
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const sortColumn = contacts[sortBy as keyof typeof contacts] || contacts.createdAt
  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)

  const [rows, countResult] = await Promise.all([
    db.select().from(contacts).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(contacts).where(where)
  ])

  return {
    contacts: rows,
    total: Number(countResult[0]?.count ?? 0),
    page,
    limit
  }
})
