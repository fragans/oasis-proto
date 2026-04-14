import { eq } from 'drizzle-orm'
import { segmentContacts, segments } from '../../../database/schema'
import { z } from 'zod'

const addContactsSchema = z.object({
  contactIds: z.array(z.string().uuid()).min(1).max(1000)
})

export default defineEventHandler(async (event) => {
  const db = useDB()
  const segmentId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const parsed = addContactsSchema.parse(body)

  const segment = await db.select().from(segments).where(eq(segments.id, segmentId)).limit(1)
  if (!segment[0]) {
    throw createError({ statusCode: 404, message: 'Segment not found' })
  }
  if (segment[0].type !== 'static') {
    throw createError({ statusCode: 400, message: 'Can only add contacts to static segments' })
  }

  const values = parsed.contactIds.map(contactId => ({
    segmentId,
    contactId
  }))

  await db.insert(segmentContacts).values(values).onConflictDoNothing()

  return { added: values.length }
})
