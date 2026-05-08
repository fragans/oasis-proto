import { eq, or } from 'drizzle-orm'
import { contacts, contactAttributes, contactCustomValues, contactEvents, eventTypes, segmentContacts } from '../../../database/schema'
import { ingestContactSchema, type AttributeType } from '~~/shared/types/contact'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)
  const parsed = ingestContactSchema.parse(body)

  // Resolve contact: email → phone → contactId
  let existingContact = null
  const lookupConditions = []
  if (parsed.contactId) lookupConditions.push(eq(contacts.id, parsed.contactId))
  if (parsed.email) lookupConditions.push(eq(contacts.email, parsed.email))
  if (parsed.phone) lookupConditions.push(eq(contacts.phone, parsed.phone))

  if (lookupConditions.length > 0) {
    const found = await db.select().from(contacts).where(or(...lookupConditions)).limit(1)
    existingContact = found[0] ?? null
  }

  // Upsert contact
  let contact: typeof contacts.$inferSelect
  if (!existingContact) {
    const [created] = await db.insert(contacts).values({
      email: parsed.email,
      phone: parsed.phone,
      lastSeenAt: new Date()
    }).returning()

    if (!created) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create contact' })
    }
    contact = created
  } else {
    await db.update(contacts)
      .set({ lastSeenAt: new Date(), updatedAt: new Date() })
      .where(eq(contacts.id, existingContact.id))
    contact = existingContact
  }

  // Process custom attributes
  if (parsed.attributes) {
    for (const [key, value] of Object.entries(parsed.attributes)) {
      const results = await db.select().from(contactAttributes).where(eq(contactAttributes.key, key)).limit(1)
      let attribute = results[0]

      if (!attribute) {
        const inferredType = typeof value === 'number'
          ? 'number'
          : typeof value === 'boolean'
            ? 'boolean'
            : 'string'
        const [created] = await db.insert(contactAttributes).values({
          key,
          label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          type: inferredType as AttributeType,
          category: 'auto'
        }).returning()
        attribute = created
      }

      if (attribute) {
        await db.insert(contactCustomValues).values({
          contactId: contact.id,
          attributeId: attribute.id,
          value: String(value),
          source: 'api'
        }).onConflictDoNothing()
      }
    }
  }

  // Process events
  if (parsed.events) {
    for (const ev of parsed.events) {
      const results = await db.select().from(eventTypes).where(eq(eventTypes.key, ev.event)).limit(1)
      let evType = results[0]

      if (!evType) {
        const [created] = await db.insert(eventTypes).values({
          key: ev.event,
          label: ev.event.replace(/[_.]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          category: 'auto'
        }).returning()
        evType = created
      }

      if (evType) {
        await db.insert(contactEvents).values({
          contactId: contact.id,
          eventTypeId: evType.id,
          properties: ev.properties,
          source: 'api',
          occurredAt: ev.occurredAt ? new Date(ev.occurredAt) : new Date()
        })
      }
    }
  }

  // Assign to static segments
  if (parsed.segmentIds && parsed.segmentIds.length > 0) {
    const values = parsed.segmentIds.map(segmentId => ({
      segmentId,
      contactId: contact.id
    }))
    await db.insert(segmentContacts).values(values).onConflictDoNothing()
  }

  return { contactId: contact.id, status: 'ok' }
})
