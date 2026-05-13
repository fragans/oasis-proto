import { campaigns } from '../../database/schema'
import { createCampaignSchema } from '~~/shared/types/campaign'
import { requireOrganizationId, requireAdmin } from '../../utils/organization'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDB()
  const body = await readBody(event)

  const parsed = createCampaignSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Validation failed',
      data: parsed.error.flatten()
    })
  }

  const organizationId = parsed.data.organizationId || await requireOrganizationId(event)

  try {
    const [campaign] = await db.insert(campaigns).values({
      organizationId: organizationId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      objective: parsed.data.objective || null,
      priority: parsed.data.priority,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      // Edge-worker delivery fields
      templateType: parsed.data.templateType || null,
      campaignType: parsed.data.campaignType,
      elementSelector: parsed.data.elementSelector || null,
      html: parsed.data.html || null,
      trigger: parsed.data.trigger || null,
      segment: parsed.data.segment || null,
      targeting: parsed.data.targeting || null,
      goal: parsed.data.goal || null,
      isTestMode: parsed.data.isTestMode
    }).returning()

    setResponseStatus(event, 201)
    return campaign
  } catch (err: unknown) {
    const error = err as Error
    console.error('[POST /api/campaigns] Database error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: error.message || 'Failed to insert campaign into database'
    })
  }
})
