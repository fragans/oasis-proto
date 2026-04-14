import { segments } from '../../database/schema'
import { createSegmentSchema } from '~~/shared/types/contact'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)
  const parsed = createSegmentSchema.parse(body)

  const [created] = await db.insert(segments).values(parsed).returning()

  setResponseStatus(event, 201)
  return created
})
