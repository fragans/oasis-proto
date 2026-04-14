import { eq } from 'drizzle-orm'
import { emailTemplates } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!

  const [deleted] = await db.delete(emailTemplates).where(eq(emailTemplates.id, id)).returning()

  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Template not found' })
  }

  return { success: true }
})
