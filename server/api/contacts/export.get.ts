import { ilike, and, sql } from 'drizzle-orm'
import { contacts } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)

  const conditions = []

  if (query.search) {
    const term = `%${query.search}%`
    conditions.push(
      sql`(${ilike(contacts.email, term)} OR ${ilike(contacts.firstName, term)} OR ${ilike(contacts.lastName, term)})`
    )
  }

  if (query.tags) {
    const tagList = (query.tags as string).split(',')
    conditions.push(sql`${contacts.tags} ?| array[${sql.join(tagList.map(t => sql`${t}`), sql`, `)}]`)
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const rows = await db.select().from(contacts).where(where).limit(10000)

  const headers = ['id', 'email', 'phone', 'firstName', 'lastName', 'birthday', 'gender', 'language', 'city', 'province', 'country', 'tags', 'createdAt']
  const csvLines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map((h) => {
        const val = row[h as keyof typeof row]
        if (val === null || val === undefined) return ''
        if (Array.isArray(val)) return `"${val.join(';')}"`
        const str = String(val)
        return str.includes(',') ? `"${str}"` : str
      }).join(',')
    )
  ]

  setResponseHeader(event, 'Content-Type', 'text/csv')
  setResponseHeader(event, 'Content-Disposition', 'attachment; filename="contacts.csv"')
  return csvLines.join('\n')
})
