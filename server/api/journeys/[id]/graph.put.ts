import { eq } from 'drizzle-orm'
import { journeys, journeyNodes, journeyEdges } from '../../../database/schema'
import { saveJourneyGraphSchema } from '~~/shared/types/journey'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const parsed = saveJourneyGraphSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 422, message: 'Validation failed', data: parsed.error.flatten() })
  }

  const [journey] = await db.select().from(journeys).where(eq(journeys.id, id)).limit(1)

  if (!journey) {
    throw createError({ statusCode: 404, message: 'Journey not found' })
  }

  if (journey.status !== 'draft') {
    throw createError({ statusCode: 422, message: 'Only draft journeys can have their graph modified' })
  }

  // Delete existing nodes and edges (cascade will handle edges via FK)
  await db.delete(journeyEdges).where(eq(journeyEdges.journeyId, id))
  await db.delete(journeyNodes).where(eq(journeyNodes.journeyId, id))

  // Insert new nodes
  const nodeIdMap = new Map<string, string>()

  if (parsed.data.nodes.length > 0) {
    const insertedNodes = await db.insert(journeyNodes)
      .values(parsed.data.nodes.map(n => ({
        journeyId: id,
        type: n.type,
        label: n.label,
        config: n.config,
        positionX: n.positionX,
        positionY: n.positionY
      })))
      .returning()

    parsed.data.nodes.forEach((original, i) => {
      nodeIdMap.set(original.id, insertedNodes[i]!.id)
    })
  }

  // Insert new edges with mapped node IDs
  if (parsed.data.edges.length > 0) {
    await db.insert(journeyEdges)
      .values(parsed.data.edges.map(e => ({
        journeyId: id,
        sourceNodeId: nodeIdMap.get(e.sourceNodeId) || e.sourceNodeId,
        targetNodeId: nodeIdMap.get(e.targetNodeId) || e.targetNodeId,
        sourceHandle: e.sourceHandle,
        label: e.label
      })))
  }

  await db.update(journeys).set({ updatedAt: new Date() }).where(eq(journeys.id, id))

  // Return the saved graph
  const [nodes, edges] = await Promise.all([
    db.select().from(journeyNodes).where(eq(journeyNodes.journeyId, id)),
    db.select().from(journeyEdges).where(eq(journeyEdges.journeyId, id))
  ])

  return { nodes, edges }
})
