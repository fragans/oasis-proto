import { eq } from 'drizzle-orm'
import { contacts } from '../../database/schema'
import { updateContactSchema } from '~~/shared/types/contact'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const parsed = updateContactSchema.parse(body)

  const [updated] = await db.update(contacts)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(contacts.id, id))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Contact not found' })
  }

  return updated
})
