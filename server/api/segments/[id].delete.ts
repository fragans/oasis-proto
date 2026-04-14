import { eq } from 'drizzle-orm'
import { segments } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!

  const [deleted] = await db.delete(segments).where(eq(segments.id, id)).returning()

  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Segment not found' })
  }

  return { success: true }
})
