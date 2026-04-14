import { emailTemplates } from '../../database/schema'
import { createEmailTemplateSchema } from '~~/shared/types/journey'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)

  const parsed = createEmailTemplateSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 422, message: 'Validation failed', data: parsed.error.flatten() })
  }

  const [template] = await db.insert(emailTemplates).values(parsed.data).returning()

  setResponseStatus(event, 201)
  return template
})
