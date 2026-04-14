import { eq } from 'drizzle-orm'
import { segments } from '../../database/schema'
import { updateSegmentSchema } from '~~/shared/types/contact'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const parsed = updateSegmentSchema.parse(body)

  const [updated] = await db.update(segments)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(segments.id, id))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Segment not found' })
  }

  return updated
})
