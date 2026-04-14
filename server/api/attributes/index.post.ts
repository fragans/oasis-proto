import { contactAttributes } from '../../database/schema'
import { createAttributeSchema } from '~~/shared/types/contact'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)
  const parsed = createAttributeSchema.parse(body)

  const [created] = await db.insert(contactAttributes).values(parsed).returning()

  setResponseStatus(event, 201)
  return created
})
