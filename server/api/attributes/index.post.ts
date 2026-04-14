import { contactAttributes } from '../../database/schema'
import { createAttributeSchema } from '~~/shared/types/contact'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)
  const parsed = createAttributeSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Failed',
      data: parsed.error.issues
    })
  }
  const [created] = await db.insert(contactAttributes).values(parsed.data).returning()

  setResponseStatus(event, 201)
  return created
})
