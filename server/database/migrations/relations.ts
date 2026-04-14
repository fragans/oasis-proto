import { relations } from 'drizzle-orm/relations'
import { segments, segmentContacts, contacts, contactDevices, contactEvents, eventTypes, campaigns, creatives, contactCustomValues, contactAttributes, journeys, journeyEdges, journeyNodes, journeyEnrollments, journeyExecutions } from './schema'

export const segmentContactsRelations = relations(segmentContacts, ({ one }) => ({
  segment: one(segments, {
    fields: [segmentContacts.segmentId],
    references: [segments.id]
  }),
  contact: one(contacts, {
    fields: [segmentContacts.contactId],
    references: [contacts.id]
  })
}))

export const segmentsRelations = relations(segments, ({ many }) => ({
  segmentContacts: many(segmentContacts),
  journeys: many(journeys)
}))

export const contactsRelations = relations(contacts, ({ many }) => ({
  segmentContacts: many(segmentContacts),
  contactDevices: many(contactDevices),
  contactEvents: many(contactEvents),
  contactCustomValues: many(contactCustomValues),
  journeyEnrollments: many(journeyEnrollments)
}))

export const contactDevicesRelations = relations(contactDevices, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactDevices.contactId],
    references: [contacts.id]
  })
}))

export const contactEventsRelations = relations(contactEvents, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactEvents.contactId],
    references: [contacts.id]
  }),
  eventType: one(eventTypes, {
    fields: [contactEvents.eventTypeId],
    references: [eventTypes.id]
  })
}))

export const eventTypesRelations = relations(eventTypes, ({ many }) => ({
  contactEvents: many(contactEvents)
}))

export const creativesRelations = relations(creatives, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [creatives.campaignId],
    references: [campaigns.id]
  })
}))

export const campaignsRelations = relations(campaigns, ({ many }) => ({
  creatives: many(creatives)
}))

export const contactCustomValuesRelations = relations(contactCustomValues, ({ one }) => ({
  contact: one(contacts, {
    fields: [contactCustomValues.contactId],
    references: [contacts.id]
  }),
  contactAttribute: one(contactAttributes, {
    fields: [contactCustomValues.attributeId],
    references: [contactAttributes.id]
  })
}))

export const contactAttributesRelations = relations(contactAttributes, ({ many }) => ({
  contactCustomValues: many(contactCustomValues)
}))

export const journeysRelations = relations(journeys, ({ one, many }) => ({
  segment: one(segments, {
    fields: [journeys.segmentId],
    references: [segments.id]
  }),
  journeyEdges: many(journeyEdges),
  journeyNodes: many(journeyNodes),
  journeyEnrollments: many(journeyEnrollments)
}))

export const journeyEdgesRelations = relations(journeyEdges, ({ one }) => ({
  journey: one(journeys, {
    fields: [journeyEdges.journeyId],
    references: [journeys.id]
  }),
  journeyNode_sourceNodeId: one(journeyNodes, {
    fields: [journeyEdges.sourceNodeId],
    references: [journeyNodes.id],
    relationName: 'journeyEdges_sourceNodeId_journeyNodes_id'
  }),
  journeyNode_targetNodeId: one(journeyNodes, {
    fields: [journeyEdges.targetNodeId],
    references: [journeyNodes.id],
    relationName: 'journeyEdges_targetNodeId_journeyNodes_id'
  })
}))

export const journeyNodesRelations = relations(journeyNodes, ({ one, many }) => ({
  journeyEdges_sourceNodeId: many(journeyEdges, {
    relationName: 'journeyEdges_sourceNodeId_journeyNodes_id'
  }),
  journeyEdges_targetNodeId: many(journeyEdges, {
    relationName: 'journeyEdges_targetNodeId_journeyNodes_id'
  }),
  journey: one(journeys, {
    fields: [journeyNodes.journeyId],
    references: [journeys.id]
  }),
  journeyEnrollments: many(journeyEnrollments),
  journeyExecutions: many(journeyExecutions)
}))

export const journeyEnrollmentsRelations = relations(journeyEnrollments, ({ one, many }) => ({
  journey: one(journeys, {
    fields: [journeyEnrollments.journeyId],
    references: [journeys.id]
  }),
  contact: one(contacts, {
    fields: [journeyEnrollments.contactId],
    references: [contacts.id]
  }),
  journeyNode: one(journeyNodes, {
    fields: [journeyEnrollments.currentNodeId],
    references: [journeyNodes.id]
  }),
  journeyExecutions: many(journeyExecutions)
}))

export const journeyExecutionsRelations = relations(journeyExecutions, ({ one }) => ({
  journeyEnrollment: one(journeyEnrollments, {
    fields: [journeyExecutions.enrollmentId],
    references: [journeyEnrollments.id]
  }),
  journeyNode: one(journeyNodes, {
    fields: [journeyExecutions.nodeId],
    references: [journeyNodes.id]
  })
}))
