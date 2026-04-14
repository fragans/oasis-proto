import { eq } from 'drizzle-orm'
import { journeys, journeyNodes } from '../../../database/schema'
import { changeJourneyStatusSchema, JOURNEY_STATUS_TRANSITIONS } from '~~/shared/types/journey'
import type { JourneyStatus } from '~~/shared/types/journey'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const parsed = changeJourneyStatusSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 422, message: 'Validation failed', data: parsed.error.flatten() })
  }

  const [journey] = await db.select().from(journeys).where(eq(journeys.id, id)).limit(1)

  if (!journey) {
    throw createError({ statusCode: 404, message: 'Journey not found' })
  }

  const currentStatus = journey.status as JourneyStatus
  const newStatus = parsed.data.status as JourneyStatus
  const allowedTransitions = JOURNEY_STATUS_TRANSITIONS[currentStatus]

  if (!allowedTransitions.includes(newStatus)) {
    throw createError({
      statusCode: 422,
      message: `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed: ${allowedTransitions.join(', ') || 'none'}`
    })
  }

  // Validate journey has at least a trigger node before activation
  if (newStatus === 'active') {
    const nodes = await db.select().from(journeyNodes).where(eq(journeyNodes.journeyId, id))
    const hasTrigger = nodes.some(n => n.type === 'trigger')
    if (!hasTrigger) {
      throw createError({ statusCode: 422, message: 'Journey must have a trigger node before activation' })
    }
    if (nodes.length < 2) {
      throw createError({ statusCode: 422, message: 'Journey must have at least one action node besides the trigger' })
    }
  }

  const updates: Record<string, unknown> = {
    status: newStatus,
    updatedAt: new Date()
  }

  if (newStatus === 'active' && !journey.startedAt) {
    updates.startedAt = new Date()
  }

  if (newStatus === 'completed') {
    updates.completedAt = new Date()
  }

  const [updated] = await db.update(journeys)
    .set(updates)
    .where(eq(journeys.id, id))
    .returning()

  return updated
})
