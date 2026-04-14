import { asc } from 'drizzle-orm'
import { contactAttributes } from '../../database/schema'

export default defineEventHandler(async () => {
  const db = useDB()
  const rows = await db.select().from(contactAttributes).orderBy(asc(contactAttributes.category), asc(contactAttributes.label))
  return { attributes: rows }
})
