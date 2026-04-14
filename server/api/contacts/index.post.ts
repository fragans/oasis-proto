import { contacts } from '../../database/schema'
import { createContactSchema } from '~~/shared/types/contact'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)
  const parsed = createContactSchema.parse(body)

  const [created] = await db.insert(contacts).values(parsed).returning()

  setResponseStatus(event, 201)
  return created
})
