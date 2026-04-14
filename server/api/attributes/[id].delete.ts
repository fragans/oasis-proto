import { eq, sql } from 'drizzle-orm'
import { contactAttributes, contactCustomValues } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!

  const existing = await db.select().from(contactAttributes).where(eq(contactAttributes.id, id)).limit(1)
  if (!existing[0]) {
    throw createError({ statusCode: 404, message: 'Attribute not found' })
  }
  if (existing[0].isDefault) {
    throw createError({ statusCode: 403, message: 'Cannot delete default attributes' })
  }

  const [usageCount] = await db.select({ count: sql<number>`count(*)` })
    .from(contactCustomValues)
    .where(eq(contactCustomValues.attributeId, id))
  const hasData = Number(usageCount.count) > 0

  await db.delete(contactAttributes).where(eq(contactAttributes.id, id))

  return { success: true, hadData: hasData }
})
