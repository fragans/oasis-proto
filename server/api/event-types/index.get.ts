import { asc } from 'drizzle-orm'
import { eventTypes } from '../../database/schema'

export default defineEventHandler(async () => {
  const db = useDB()
  const rows = await db.select().from(eventTypes).orderBy(asc(eventTypes.category), asc(eventTypes.label))
  return { eventTypes: rows }
})
