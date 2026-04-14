import { eq, and, inArray } from 'drizzle-orm'
import { journeys, journeyNodes, journeyEnrollments, journeyExecutions, contacts } from '../../../database/schema'
import { enrollContactsSchema } from '~~/shared/types/journey'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const parsed = enrollContactsSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 422, message: 'Validation failed', data: parsed.error.flatten() })
  }

  const [journey] = await db.select().from(journeys).where(eq(journeys.id, id)).limit(1)

  if (!journey) {
    throw createError({ statusCode: 404, message: 'Journey not found' })
  }

  if (journey.status !== 'active') {
    throw createError({ statusCode: 422, message: 'Can only enroll contacts into active journeys' })
  }

  // Find the trigger node as entry point
  const nodes = await db.select().from(journeyNodes).where(eq(journeyNodes.journeyId, id))
  const triggerNode = nodes.find(n => n.type === 'trigger')

  if (!triggerNode) {
    throw createError({ statusCode: 422, message: 'Journey has no trigger node' })
  }

  // Verify contacts exist
  const validContacts = await db.select({ id: contacts.id })
    .from(contacts)
    .where(inArray(contacts.id, parsed.data.contactIds))

  const validIds = new Set(validContacts.map(c => c.id))

  // Check for already-enrolled contacts
  const existingEnrollments = await db.select({ contactId: journeyEnrollments.contactId })
    .from(journeyEnrollments)
    .where(and(
      eq(journeyEnrollments.journeyId, id),
      eq(journeyEnrollments.status, 'active')
    ))

  const alreadyEnrolled = new Set(existingEnrollments.map(e => e.contactId))

  const toEnroll = parsed.data.contactIds.filter(cid => validIds.has(cid) && !alreadyEnrolled.has(cid))

  if (toEnroll.length === 0) {
    return { enrolled: 0, skipped: parsed.data.contactIds.length, message: 'No new contacts to enroll' }
  }

  // Create enrollments
  const enrollments = await db.insert(journeyEnrollments)
    .values(toEnroll.map(contactId => ({
      journeyId: id,
      contactId,
      currentNodeId: triggerNode.id,
      metadata: parsed.data.metadata || {}
    })))
    .returning()

  // Create initial executions for the trigger node (auto-complete triggers)
  await db.insert(journeyExecutions)
    .values(enrollments.map(enrollment => ({
      enrollmentId: enrollment.id,
      nodeId: triggerNode.id,
      status: 'completed' as const,
      startedAt: new Date(),
      completedAt: new Date(),
      result: { auto: true }
    })))

  // Update journey enrollment count
  await db.update(journeys)
    .set({ enrollmentCount: (journey.enrollmentCount ?? 0) + toEnroll.length, updatedAt: new Date() })
    .where(eq(journeys.id, id))

  setResponseStatus(event, 201)
  return {
    enrolled: toEnroll.length,
    skipped: parsed.data.contactIds.length - toEnroll.length,
    enrollments
  }
})
