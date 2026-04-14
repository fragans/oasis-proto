import { eq, sql } from 'drizzle-orm'
import { segments, segmentContacts } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!

  const segment = await db.select().from(segments).where(eq(segments.id, id)).limit(1)

  if (!segment[0]) {
    throw createError({ statusCode: 404, message: 'Segment not found' })
  }

  const [countResult] = await db.select({ count: sql<number>`count(*)` })
    .from(segmentContacts)
    .where(eq(segmentContacts.segmentId, id))

  return {
    ...segment[0],
    contactCount: Number(countResult.count)
  }
})
