import { eq } from 'drizzle-orm'
import { journeys, journeyNodes, journeyEdges, segments } from '../../database/schema'
import type { JourneyStatus } from '~~/shared/types/journey'
import { JOURNEY_STATUS_TRANSITIONS } from '~~/shared/types/journey'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!

  const [journey] = await db.select().from(journeys).where(eq(journeys.id, id)).limit(1)

  if (!journey) {
    throw createError({ statusCode: 404, message: 'Journey not found' })
  }

  const [nodes, edges] = await Promise.all([
    db.select().from(journeyNodes).where(eq(journeyNodes.journeyId, id)),
    db.select().from(journeyEdges).where(eq(journeyEdges.journeyId, id))
  ])

  let segment = null
  if (journey.segmentId) {
    const [seg] = await db.select({ id: segments.id, name: segments.name })
      .from(segments)
      .where(eq(segments.id, journey.segmentId))
      .limit(1)
    segment = seg || null
  }

  return {
    ...journey,
    nodes,
    edges,
    segment,
    availableTransitions: JOURNEY_STATUS_TRANSITIONS[journey.status as JourneyStatus] || [],
    isEditable: journey.status === 'draft'
  }
})
