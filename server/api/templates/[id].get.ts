import { eq } from 'drizzle-orm'
import { emailTemplates } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!

  const template = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id)).limit(1)

  if (!template[0]) {
    throw createError({ statusCode: 404, message: 'Template not found' })
  }

  return template[0]
})
