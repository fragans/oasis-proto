import Redis from 'ioredis'
import { eq } from 'drizzle-orm'
import { campaigns } from '../database/schema'

let _redis: Redis

export function getRedisClient(): Redis {
  if (!_redis) {
    const config = useRuntimeConfig()
    _redis = new Redis({
      host: config.redisHost,
      port: Number(config.redisPort),
      maxRetriesPerRequest: 3
    })
  }
  return _redis
}

export async function syncCampaignToRedis(campaignId: string) {
  const db = useDB()
  const redis = getRedisClient()

  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, campaignId),
    with: { creatives: true }
  })

  if (!campaign) return

  const payload = JSON.stringify({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    priority: campaign.priority,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    creatives: campaign.creatives.map(c => ({
      id: c.id,
      type: c.type,
      fileUrl: c.fileUrl,
      clickUrl: c.clickUrl,
      altText: c.altText,
      width: c.width,
      height: c.height
    }))
  })

  await redis.set(`campaign:${campaignId}`, payload)
  await redis.sadd('campaigns:active', campaignId)
}

export async function removeCampaignFromRedis(campaignId: string) {
  const redis = getRedisClient()
  await redis.del(`campaign:${campaignId}`)
  await redis.srem('campaigns:active', campaignId)
}

export async function syncAllActiveCampaigns() {
  const db = useDB()
  const activeCampaigns = await db.query.campaigns.findMany({
    where: eq(campaigns.status, 'active'),
    with: { creatives: true }
  })

  for (const campaign of activeCampaigns) {
    await syncCampaignToRedis(campaign.id)
  }

  console.log(`[Redis] Synced ${activeCampaigns.length} active campaigns`)
}
