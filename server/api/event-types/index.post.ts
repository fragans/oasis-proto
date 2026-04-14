import { eventTypes } from '../../database/schema'
import { createEventTypeSchema } from '~~/shared/types/contact'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)
  const parsed = createEventTypeSchema.parse(body)

  const [created] = await db.insert(eventTypes).values(parsed).returning()

  setResponseStatus(event, 201)
  return created
})
