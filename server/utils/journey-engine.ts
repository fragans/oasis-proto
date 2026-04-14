import { eq, and, lte } from 'drizzle-orm'
import {
  journeyExecutions,
  journeyEnrollments,
  journeyNodes,
  journeyEdges,
  journeys,
  contacts,
  contactCustomValues,
  contactAttributes,
  segmentContacts
} from '../database/schema'

interface ExecutionContext {
  enrollmentId: string
  contactId: string
  nodeId: string
  nodeType: string
  nodeConfig: Record<string, unknown>
  metadata: Record<string, unknown>
}

/**
 * Process pending journey executions that are scheduled at or before now.
 * Called periodically by the journey scheduler plugin.
 */
export async function processJourneyExecutions(): Promise<number> {
  const db = useDB()
  const now = new Date()

  // Find pending executions that are due
  const pendingExecutions = await db.select({
    execution: journeyExecutions,
    enrollment: journeyEnrollments,
    node: journeyNodes
  })
    .from(journeyExecutions)
    .innerJoin(journeyEnrollments, eq(journeyExecutions.enrollmentId, journeyEnrollments.id))
    .innerJoin(journeyNodes, eq(journeyExecutions.nodeId, journeyNodes.id))
    .where(and(
      eq(journeyExecutions.status, 'pending'),
      lte(journeyExecutions.scheduledAt, now),
      eq(journeyEnrollments.status, 'active')
    ))
    .limit(100)

  let processed = 0

  for (const { execution, enrollment, node } of pendingExecutions) {
    try {
      // Mark as executing
      await db.update(journeyExecutions)
        .set({ status: 'executing', startedAt: new Date() })
        .where(eq(journeyExecutions.id, execution.id))

      const context: ExecutionContext = {
        enrollmentId: enrollment.id,
        contactId: enrollment.contactId,
        nodeId: node.id,
        nodeType: node.type,
        nodeConfig: (node.config as Record<string, unknown>) || {},
        metadata: (enrollment.metadata as Record<string, unknown>) || {}
      }

      const result = await executeNode(context)

      // Mark execution as completed
      await db.update(journeyExecutions)
        .set({ status: 'completed', completedAt: new Date(), result })
        .where(eq(journeyExecutions.id, execution.id))

      // Advance to next node(s)
      await advanceToNextNodes(enrollment.id, node.id, enrollment.journeyId, result)

      processed++
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      await db.update(journeyExecutions)
        .set({ status: 'failed', completedAt: new Date(), error: errorMessage })
        .where(eq(journeyExecutions.id, execution.id))

      // Mark enrollment as failed on critical errors
      await db.update(journeyEnrollments)
        .set({ status: 'failed', exitedAt: new Date(), exitReason: `Node execution failed: ${errorMessage}` })
        .where(eq(journeyEnrollments.id, enrollment.id))
    }
  }

  return processed
}

async function executeNode(ctx: ExecutionContext): Promise<Record<string, unknown>> {
  switch (ctx.nodeType) {
    case 'trigger':
      return { triggered: true }

    case 'action_email':
      return await executeEmailAction(ctx)

    case 'action_push':
      return await executePushAction(ctx)

    case 'action_banner':
      return await executeBannerAction(ctx)

    case 'action_webhook':
      return await executeWebhookAction(ctx)

    case 'condition':
      return await evaluateCondition(ctx)

    case 'delay':
      return { delayed: true }

    case 'split':
      return executeSplit(ctx)

    default:
      return { skipped: true, reason: `Unknown node type: ${ctx.nodeType}` }
  }
}

async function executeEmailAction(ctx: ExecutionContext): Promise<Record<string, unknown>> {
  const config = ctx.nodeConfig as { templateId?: string, subject?: string, fromName?: string, fromEmail?: string }

  // In production, integrate with email service (SendGrid, SES, etc.)
  // For now, log the intent and return success
  return {
    action: 'email',
    templateId: config.templateId,
    subject: config.subject,
    contactId: ctx.contactId,
    status: 'queued'
  }
}

async function executePushAction(ctx: ExecutionContext): Promise<Record<string, unknown>> {
  const config = ctx.nodeConfig as { title?: string, body?: string }

  return {
    action: 'push',
    title: config.title,
    body: config.body,
    contactId: ctx.contactId,
    status: 'queued'
  }
}

async function executeBannerAction(ctx: ExecutionContext): Promise<Record<string, unknown>> {
  const config = ctx.nodeConfig as { campaignId?: string, placement?: string }

  return {
    action: 'banner',
    campaignId: config.campaignId,
    placement: config.placement,
    contactId: ctx.contactId,
    status: 'queued'
  }
}

async function executeWebhookAction(ctx: ExecutionContext): Promise<Record<string, unknown>> {
  const config = ctx.nodeConfig as {
    url?: string
    method?: string
    headers?: Record<string, string>
    body?: Record<string, unknown>
  }

  if (!config.url) {
    return { action: 'webhook', status: 'skipped', reason: 'No URL configured' }
  }

  try {
    const response = await $fetch(config.url, {
      method: (config.method || 'POST') as 'GET' | 'POST' | 'PUT' | 'PATCH',
      headers: config.headers,
      body: config.body ? { ...config.body, contactId: ctx.contactId } : undefined
    })

    return { action: 'webhook', status: 'sent', response: typeof response === 'object' ? response : {} }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook failed'
    return { action: 'webhook', status: 'failed', error: message }
  }
}

async function evaluateCondition(ctx: ExecutionContext): Promise<Record<string, unknown>> {
  const db = useDB()
  const config = ctx.nodeConfig as {
    type?: string
    field?: string
    operator?: string
    value?: unknown
    segmentId?: string
  }

  let passed = false

  if (config.type === 'segment' && config.segmentId) {
    const [membership] = await db.select()
      .from(segmentContacts)
      .where(and(
        eq(segmentContacts.segmentId, config.segmentId),
        eq(segmentContacts.contactId, ctx.contactId)
      ))
      .limit(1)

    passed = !!membership
  } else if (config.type === 'attribute' && config.field) {
    const [attr] = await db.select()
      .from(contactAttributes)
      .where(eq(contactAttributes.key, config.field))
      .limit(1)

    if (attr) {
      const [customValue] = await db.select()
        .from(contactCustomValues)
        .where(and(
          eq(contactCustomValues.contactId, ctx.contactId),
          eq(contactCustomValues.attributeId, attr.id)
        ))
        .limit(1)

      const actualValue = customValue?.value
      passed = evaluateOperator(actualValue, config.operator || 'equals', config.value)
    }
  } else {
    // Default: check core contact fields
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, ctx.contactId)).limit(1)
    if (contact && config.field) {
      const actualValue = (contact as Record<string, unknown>)[config.field]
      passed = evaluateOperator(actualValue, config.operator || 'equals', config.value)
    }
  }

  return { condition: true, passed, handle: passed ? 'yes' : 'no' }
}

function evaluateOperator(actual: unknown, operator: string, expected: unknown): boolean {
  const actualStr = String(actual ?? '')
  const expectedStr = String(expected ?? '')

  switch (operator) {
    case 'equals': return actualStr === expectedStr
    case 'not_equals': return actualStr !== expectedStr
    case 'contains': return actualStr.includes(expectedStr)
    case 'not_contains': return !actualStr.includes(expectedStr)
    case 'starts_with': return actualStr.startsWith(expectedStr)
    case 'ends_with': return actualStr.endsWith(expectedStr)
    case 'is_set': return actual !== null && actual !== undefined && actualStr !== ''
    case 'is_not_set': return actual === null || actual === undefined || actualStr === ''
    case 'greater_than': return Number(actual) > Number(expected)
    case 'less_than': return Number(actual) < Number(expected)
    default: return false
  }
}

function executeSplit(ctx: ExecutionContext): Record<string, unknown> {
  const config = ctx.nodeConfig as { variants?: { label: string, percentage: number }[] }
  const variants = config.variants || []

  if (variants.length === 0) {
    return { split: true, variant: 'default', handle: 'default' }
  }

  const rand = Math.random() * 100
  let cumulative = 0

  for (const variant of variants) {
    cumulative += variant.percentage
    if (rand <= cumulative) {
      return { split: true, variant: variant.label, handle: variant.label.toLowerCase().replace(/\s+/g, '_') }
    }
  }

  const lastVariant = variants[variants.length - 1]!
  return { split: true, variant: lastVariant.label, handle: lastVariant.label.toLowerCase().replace(/\s+/g, '_') }
}

async function advanceToNextNodes(
  enrollmentId: string,
  currentNodeId: string,
  journeyId: string,
  executionResult: Record<string, unknown>
): Promise<void> {
  const db = useDB()

  // Find outgoing edges from current node
  const edges = await db.select()
    .from(journeyEdges)
    .where(and(
      eq(journeyEdges.journeyId, journeyId),
      eq(journeyEdges.sourceNodeId, currentNodeId)
    ))

  if (edges.length === 0) {
    // No more nodes — mark enrollment as completed
    await db.update(journeyEnrollments)
      .set({ status: 'completed', completedAt: new Date(), currentNodeId: null })
      .where(eq(journeyEnrollments.id, enrollmentId))

    // Increment completed count
    const [journey] = await db.select().from(journeys).where(eq(journeys.id, journeyId)).limit(1)
    if (journey) {
      await db.update(journeys)
        .set({ completedCount: (journey.completedCount ?? 0) + 1, updatedAt: new Date() })
        .where(eq(journeys.id, journeyId))
    }
    return
  }

  // For condition/split nodes, filter edges by handle
  let targetEdges = edges
  const resultHandle = executionResult.handle as string | undefined

  if (resultHandle) {
    const matchingEdges = edges.filter(e => e.sourceHandle === resultHandle)
    if (matchingEdges.length > 0) {
      targetEdges = matchingEdges
    }
  }

  // Schedule executions for next nodes
  for (const edge of targetEdges) {
    const [nextNode] = await db.select().from(journeyNodes).where(eq(journeyNodes.id, edge.targetNodeId)).limit(1)

    if (!nextNode) continue

    // Calculate scheduled time for delay nodes
    let scheduledAt = new Date()
    if (nextNode.type === 'delay') {
      const delayConfig = (nextNode.config as Record<string, unknown>) || {}
      const delayType = delayConfig.type as string
      const duration = delayConfig.duration as { value: number, unit: string } | undefined

      if (delayType === 'duration' && duration) {
        const ms = durationToMs(duration.value, duration.unit)
        scheduledAt = new Date(Date.now() + ms)
      } else if (delayType === 'until_date' && delayConfig.untilDate) {
        scheduledAt = new Date(delayConfig.untilDate as string)
      }
    }

    await db.insert(journeyExecutions).values({
      enrollmentId,
      nodeId: nextNode.id,
      scheduledAt
    })

    // Update current node on enrollment
    await db.update(journeyEnrollments)
      .set({ currentNodeId: nextNode.id })
      .where(eq(journeyEnrollments.id, enrollmentId))
  }
}

function durationToMs(value: number, unit: string): number {
  switch (unit) {
    case 'minutes': return value * 60 * 1000
    case 'hours': return value * 60 * 60 * 1000
    case 'days': return value * 24 * 60 * 60 * 1000
    case 'weeks': return value * 7 * 24 * 60 * 60 * 1000
    default: return value * 60 * 1000
  }
}
