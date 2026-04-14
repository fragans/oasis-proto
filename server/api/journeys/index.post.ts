import { journeys, journeyNodes } from '../../database/schema'
import { createJourneySchema } from '~~/shared/types/journey'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)

  const parsed = createJourneySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 422, message: 'Validation failed', data: parsed.error.flatten() })
  }

  const result = await db.insert(journeys).values(parsed.data).returning()
  const journey = result[0]!

  // Create a default trigger node
  await db.insert(journeyNodes).values({
    journeyId: journey.id,
    type: 'trigger',
    label: 'Entry Trigger',
    config: parsed.data.triggerConfig || {},
    positionX: 400,
    positionY: 50
  })

  setResponseStatus(event, 201)
  return journey
})
