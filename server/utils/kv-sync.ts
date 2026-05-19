import { eq, and, sql } from 'drizzle-orm'
import { organization as organizationTable, campaigns } from '../database/schema'
import type { KVCampaign, CampaignType, CampaignTrigger, Targeting, CampaignGoal } from '~~/shared/types/campaign'

/**
 * Syncs all ACTIVE and SCHEDULED campaigns for a given organization to Cloudflare KV.
 *
 * KV Key written: `organization:{organizationId}:campaigns`
 * Namespace:      staging-OASIS_DATA (id from CLOUDFLARE_KV_NAMESPACE_ID env)
 *
 * The edge worker (oasis-edge) reads this key to decide which banners to inject.
 */
export async function syncOrganizationCampaignsToKV(organizationId: string): Promise<void> {
  console.log('syncOrganizationCampaignsToKV')

  const config = useRuntimeConfig()
  const db = useDB()

  const accountId = config.cloudflareAccountId as string
  const namespaceId = config.cloudflareKvNamespaceId as string
  const apiToken = config.cloudflareApiToken as string

  if (!accountId || !namespaceId || !apiToken) {
    console.error('[KV Sync] Missing Cloudflare credentials — skipping sync')
    return
  }

  // 1. Fetch all active and scheduled campaigns for this organization from Postgres
  const activeCampaigns = await db.select().from(campaigns).where(
    and(
      eq(campaigns.organizationId, organizationId),
      sql`${campaigns.status} IN ('active', 'scheduled')`,
      sql`(${campaigns.endDate} IS NULL OR ${campaigns.endDate} > NOW())`
    )
  )

  // 2. Map to the KV format the oasis-edge worker expects
  const kvPayload: KVCampaign[] = activeCampaigns.map(c => ({
    id: c.id,
    type: (c.campaignType || 'sticky') as CampaignType,
    trigger: (c.trigger as CampaignTrigger | null) || { mode: 'immediate' },
    segment: (c.segment as string | null) ?? null, // null = show to ALL users
    targeting: (c.targeting as unknown as Targeting) ?? null,
    goal: (c.goal as unknown as CampaignGoal) ?? null,
    element_selector: c.elementSelector || 'body',
    html: c.html || '',
    isTestMode: c.isTestMode,
    startTime: c.startDate?.toISOString() ?? null,
    endTime: c.endDate?.toISOString() ?? null
  }))

  // 3. Write to Cloudflare KV via REST API
  const kvKey = `organization:${organizationId}:campaigns`
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(kvKey)}`

  try {
    await $fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(kvPayload)
    })

    console.log(`[KV Sync] ✅ Wrote ${kvPayload.length} active/scheduled campaign(s) to KV key "${kvKey}"`)
  } catch (err: unknown) {
    console.error(`[KV Sync] ❌ Failed to write to Cloudflare KV:`, err)
    throw createError({
      statusCode: 500,
      message: `Failed to sync with Cloudflare KV: ${(err instanceof Error) ? err.message : 'Unknown error'} with token: ${apiToken} `
    })
  }
}

/**
 * Removes an organization's campaign list from KV entirely.
 * Call when all campaigns for an organization are paused/completed.
 * (Usually syncOrganizationCampaignsToKV will just write an empty array.)
 */
export async function removeOrganizationCampaignsFromKV(organizationId: string): Promise<void> {
  const config = useRuntimeConfig()
  const accountId = config.cloudflareAccountId as string
  const namespaceId = config.cloudflareKvNamespaceId as string
  const apiToken = config.cloudflareApiToken as string

  if (!accountId || !namespaceId || !apiToken) return

  const kvKey = `organization:${organizationId}:campaigns`
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(kvKey)}`

  try {
    await $fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${apiToken}` }
    })
    console.log(`[KV Sync] 🗑️  Deleted KV key "${kvKey}"`)
  } catch (err: unknown) {
    console.error(`[KV Sync] ❌ Failed to delete KV key "${kvKey}":`, err)
    throw createError({
      statusCode: 500,
      message: `Failed to remove from Cloudflare KV: ${(err instanceof Error) ? err.message : 'Unknown error'}`
    })
  }
}

/**
 * Syncs an organization's global configuration to Cloudflare KV.
 *
 * KV Key written: `organization:{hostname}:config`
 */
export async function syncOrganizationConfigToKV(organizationId: string): Promise<void> {
  const config = useRuntimeConfig()
  const db = useDB()

  const accountId = config.cloudflareAccountId as string
  const namespaceId = config.cloudflareKvNamespaceId as string
  const apiToken = config.cloudflareApiToken as string

  if (!accountId || !namespaceId || !apiToken) {
    console.error('[KV Sync] Missing Cloudflare credentials — skipping config sync')
    return
  }

  // 1. Fetch organization config from Postgres
  const [organization] = await db.select().from(organizationTable).where(eq(organizationTable.id, organizationId))

  if (!organization) {
    console.warn(`[KV Sync] No organization found with ID "${organizationId}" — skipping config sync`)
    return
  }

  // 2. Map to the KV format the oasis-edge worker expects
  const kvPayload = {
    organization_id: organization.id,
    cookie_name: organization.cookieName,
    api_url: organization.apiUrl,
    auth_cookie_names: [], // Better Auth handles this differently now
    is_live: organization.isLive
  }

  // 3. Write to Cloudflare KV via REST API
  // Note: We use the hostname from the organization config as the key for resolution
  const kvKey = `organization:${organization.hostname}:config`
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(kvKey)}`

  try {
    await $fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(kvPayload)
    })

    console.log(`[KV Sync] ✅ Wrote config for organization "${organization.id}" to KV key "${kvKey}"`)
  } catch (err: unknown) {
    console.error(`[KV Sync] ❌ Failed to write organization config to Cloudflare KV:`, err)
    throw createError({
      statusCode: 500,
      message: `Failed to sync config with Cloudflare KV: ${err instanceof Error ? err.message : 'Unknown error'}`
    })
  }
}

/**
 * Removes an organization's global configuration from Cloudflare KV.
 * Call when an organization is deleted from the database.
 */
export async function removeOrganizationConfigFromKV(hostname: string): Promise<void> {
  const config = useRuntimeConfig()

  const accountId = config.cloudflareAccountId as string
  const namespaceId = config.cloudflareKvNamespaceId as string
  const apiToken = config.cloudflareApiToken as string

  if (!accountId || !namespaceId || !apiToken) return

  const kvKey = `organization:${hostname}:config`
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(kvKey)}`

  try {
    await $fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${apiToken}` }
    })
    console.log(`[KV Sync] 🗑️ Removed config for organization hostname "${hostname}" from KV key "${kvKey}"`)
  } catch (err: unknown) {
    console.error(`[KV Sync] ❌ Failed to delete organization config from Cloudflare KV:`, err)
    throw createError({
      statusCode: 500,
      message: `Failed to remove config from Cloudflare KV: ${err instanceof Error ? err.message : 'Unknown error'}`
    })
  }
}

/**
 * Maintenance function to purge "Ghost Campaigns" across the entire system.
 * Scans all organizations and re-syncs their KV state to ensure it only
 * contains truly active campaigns.
 */
export async function cleanUpAllGhostCampaigns(): Promise<void> {
  const db = useDB()

  console.log('[KV Cleanup] 🧹 Starting global ghost campaign cleanup...')

  try {
    const orgs = await db.select({ id: organizationTable.id }).from(organizationTable)

    for (const org of orgs) {
      await syncOrganizationCampaignsToKV(org.id)
    }

    console.log(`[KV Cleanup] ✅ Global cleanup completed for ${orgs.length} organization(s)`)
  } catch (err) {
    console.error('[KV Cleanup] ❌ Global cleanup failed:', err)
    throw err
  }
}
