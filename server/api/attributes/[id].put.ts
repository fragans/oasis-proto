import { eq } from 'drizzle-orm'
import { contactAttributes } from '../../database/schema'
import { updateAttributeSchema } from '~~/shared/types/contact'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const parsed = updateAttributeSchema.parse(body)

  const existing = await db.select().from(contactAttributes).where(eq(contactAttributes.id, id)).limit(1)
  if (!existing[0]) {
    throw createError({ statusCode: 404, message: 'Attribute not found' })
  }
  if (existing[0].isDefault) {
    throw createError({ statusCode: 403, message: 'Cannot modify default attributes' })
  }

  const [updated] = await db.update(contactAttributes).set(parsed).where(eq(contactAttributes.id, id)).returning()
  return updated
})
