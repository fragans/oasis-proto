import { eq } from 'drizzle-orm'
import { contacts } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!

  const [deleted] = await db.delete(contacts).where(eq(contacts.id, id)).returning()

  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Contact not found' })
  }

  return { success: true }
})
