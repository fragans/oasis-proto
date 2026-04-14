import { eq } from 'drizzle-orm'
import { emailTemplates } from '../../database/schema'
import { updateEmailTemplateSchema } from '~~/shared/types/journey'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const parsed = updateEmailTemplateSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 422, message: 'Validation failed', data: parsed.error.flatten() })
  }

  const [updated] = await db.update(emailTemplates)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(emailTemplates.id, id))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Template not found' })
  }

  return updated
})
