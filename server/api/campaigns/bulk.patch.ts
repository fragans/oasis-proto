import { inArray, eq } from 'drizzle-orm'
import { campaigns } from '../../database/schema'
import { bulkActionSchema, STATUS_TRANSITIONS } from '~~/shared/types/campaign'
import type { CampaignStatus } from '~~/shared/types/campaign'

const ACTION_TO_STATUS: Record<string, CampaignStatus> = {
  pause: 'paused',
  resume: 'active',
  archive: 'completed'
}

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)

  const parsed = bulkActionSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Validation failed',
      data: parsed.error.flatten()
    })
  }

  const targetStatus = ACTION_TO_STATUS[parsed.data.action]!
  const rows = await db.select().from(campaigns).where(inArray(campaigns.id, parsed.data.ids))

  const results = { updated: 0, skipped: 0, errors: [] as string[] }

  for (const campaign of rows) {
    const currentStatus = campaign.status as CampaignStatus
    const allowed = STATUS_TRANSITIONS[currentStatus]
    if (!allowed.includes(targetStatus)) {
      results.skipped++
      results.errors.push(`${campaign.name}: cannot transition from '${campaign.status}' to '${targetStatus}'`)
      continue
    }

    await db.update(campaigns)
      .set({ status: targetStatus, updatedAt: new Date() })
      .where(eq(campaigns.id, campaign.id))

    if (targetStatus === 'active') {
      await syncCampaignToRedis(campaign.id)
    } else if (targetStatus === 'paused' || targetStatus === 'completed') {
      await removeCampaignFromRedis(campaign.id)
    }

    results.updated++
  }

  return results
})
