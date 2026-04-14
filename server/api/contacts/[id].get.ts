import { eq } from 'drizzle-orm'
import { contacts, contactDevices, contactCustomValues, contactAttributes, contactEvents, eventTypes, segmentContacts, segments } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!

  const contact = await db.query.contacts.findFirst({
    where: eq(contacts.id, id),
    with: {
      devices: true,
      customValues: {
        with: { attribute: true }
      },
      events: {
        with: { eventType: true },
        orderBy: (e, { desc }) => [desc(e.occurredAt)],
        limit: 50
      },
      segmentMemberships: true
    }
  })

  if (!contact) {
    throw createError({ statusCode: 404, message: 'Contact not found' })
  }

  const membershipSegmentIds = contact.segmentMemberships.map(m => m.segmentId)
  let contactSegments: { id: string, name: string }[] = []
  if (membershipSegmentIds.length > 0) {
    const segmentRows = await db.select({ id: segments.id, name: segments.name })
      .from(segments)
      .where(sql`${segments.id} = ANY(${membershipSegmentIds})`)
    contactSegments = segmentRows
  }

  const { segmentMemberships, ...rest } = contact
  return { ...rest, segments: contactSegments }
})
