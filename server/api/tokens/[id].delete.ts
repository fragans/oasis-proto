import { eq } from 'drizzle-orm'
import { apiTokens } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!

  const [deleted] = await db.delete(apiTokens).where(eq(apiTokens.id, id)).returning()

  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Token not found' })
  }

  return { success: true }
})
