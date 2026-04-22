import { eq } from 'drizzle-orm'
import { campaigns } from '../../database/schema'
import { updateCampaignSchema } from '~~/shared/types/campaign'
import { syncTenantCampaignsToKV } from '../../utils/kv-sync'
import z from 'zod'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const parsed = updateCampaignSchema.safeParse(body)
  if (!parsed.success) {
    console.log(parsed.error)
    throw createError({
      statusCode: 400,
      message: 'Validation failed',
      data: z.treeifyError(parsed.error)
    })
  }

  const existing = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, id)
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Campaign not found' })
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (parsed.data.tenantId !== undefined) updateData.tenantId = parsed.data.tenantId
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description
  if (parsed.data.objective !== undefined) updateData.objective = parsed.data.objective
  if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority
  if (parsed.data.startDate !== undefined) {
    updateData.startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : null
  }
  if (parsed.data.endDate !== undefined) {
    updateData.endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : null
  }
  // Edge-worker delivery fields
  if (parsed.data.templateType !== undefined) updateData.templateType = parsed.data.templateType
  if (parsed.data.campaignType !== undefined) updateData.campaignType = parsed.data.campaignType
  if (parsed.data.elementSelector !== undefined) updateData.elementSelector = parsed.data.elementSelector
  if (parsed.data.html !== undefined) updateData.html = parsed.data.html
  if (parsed.data.trigger !== undefined) updateData.trigger = parsed.data.trigger
  if (parsed.data.segment !== undefined) updateData.segment = parsed.data.segment
  if (parsed.data.targeting !== undefined) updateData.targeting = parsed.data.targeting
  if (parsed.data.goal !== undefined) updateData.goal = parsed.data.goal
  if (parsed.data.isTestMode !== undefined) updateData.isTestMode = parsed.data.isTestMode

  const [updated] = await db.update(campaigns)
    .set(updateData)
    .where(eq(campaigns.id, id))
    .returning()

  if (updated && updated.status === 'active') {
    const config = useRuntimeConfig()
    const tenantId = (updated.tenantId as string | undefined) || existing.tenantId || config.public.defaultTenantId
    await syncTenantCampaignsToKV(tenantId)
  }

  return updated
})
