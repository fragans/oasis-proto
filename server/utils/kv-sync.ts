import { eq, and } from 'drizzle-orm'
import { campaigns, tenants } from '../database/schema'
import type { KVCampaign, CampaignType, CampaignTrigger, Targeting, CampaignGoal } from '~~/shared/types/campaign'

/**
 * Syncs all ACTIVE campaigns for a given tenant to Cloudflare KV.
 *
 * KV Key written: `tenant:{tenantId}:campaigns`
 * Namespace:      staging-OASIS_DATA (id from CLOUDFLARE_KV_NAMESPACE_ID env)
 *
 * The edge worker (oasis-edge) reads this key to decide which banners to inject.
 */
export async function syncTenantCampaignsToKV(tenantId: string): Promise<void> {
  console.log('syncTenantCampaignsToKV')

  const config = useRuntimeConfig()
  const db = useDB()

  const accountId = config.cloudflareAccountId as string
  const namespaceId = config.cloudflareKvNamespaceId as string
  const apiToken = config.cloudflareApiToken as string

  if (!accountId || !namespaceId || !apiToken) {
    console.error('[KV Sync] Missing Cloudflare credentials — skipping sync')
    return
  }

  // 1. Fetch all active campaigns for this tenant from Postgres
  const activeCampaigns = await db.select().from(campaigns).where(
    and(
      eq(campaigns.tenantId, tenantId),
      eq(campaigns.status, 'active')
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
    isTestMode: c.isTestMode
  }))

  // 3. Write to Cloudflare KV via REST API
  const kvKey = `tenant:${tenantId}:campaigns`
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

    console.log(`[KV Sync] ✅ Wrote ${kvPayload.length} active campaign(s) to KV key "${kvKey}"`)
  } catch (err) {
    console.error(`[KV Sync] ❌ Failed to write to Cloudflare KV:`, err)
    throw err
  }
}

/**
 * Removes a tenant's campaign list from KV entirely.
 * Call when all campaigns for a tenant are paused/completed.
 * (Usually syncTenantCampaignsToKV will just write an empty array.)
 */
export async function removeTenantCampaignsFromKV(tenantId: string): Promise<void> {
  const config = useRuntimeConfig()
  const accountId = config.cloudflareAccountId as string
  const namespaceId = config.cloudflareKvNamespaceId as string
  const apiToken = config.cloudflareApiToken as string

  if (!accountId || !namespaceId || !apiToken) return

  const kvKey = `tenant:${tenantId}:campaigns`
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(kvKey)}`

  try {
    await $fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${apiToken}` }
    })
    console.log(`[KV Sync] 🗑️  Deleted KV key "${kvKey}"`)
  } catch (err) {
    console.error(`[KV Sync] ❌ Failed to delete KV key "${kvKey}":`, err)
  }
}

/**
 * Syncs a tenant's global configuration to Cloudflare KV.
 *
 * KV Key written: `tenant:{hostname}:config`
 */
export async function syncTenantConfigToKV(tenantId: string): Promise<void> {
  const config = useRuntimeConfig()
  const db = useDB()

  const accountId = config.cloudflareAccountId as string
  const namespaceId = config.cloudflareKvNamespaceId as string
  const apiToken = config.cloudflareApiToken as string

  if (!accountId || !namespaceId || !apiToken) {
    console.error('[KV Sync] Missing Cloudflare credentials — skipping config sync')
    return
  }

  // 1. Fetch tenant config from Postgres
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId))

  if (!tenant) {
    console.warn(`[KV Sync] No tenant found with ID "${tenantId}" — skipping config sync`)
    return
  }

  // 2. Map to the KV format the oasis-edge worker expects
  const kvPayload = {
    tenant_id: tenant.id,
    cookie_name: tenant.cookieName,
    api_url: tenant.apiUrl,
    auth_cookie_names: tenant.authCookieNames || [],
    is_live: tenant.isLive
  }

  // 3. Write to Cloudflare KV via REST API
  // Note: We use the hostname from the tenant config as the key for resolution
  const kvKey = `tenant:${tenant.hostname}:config`
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

    console.log(`[KV Sync] ✅ Wrote config for tenant "${tenant.id}" to KV key "${kvKey}"`)
  } catch (err) {
    console.error(`[KV Sync] ❌ Failed to write tenant config to Cloudflare KV:`, err)
    throw err
  }
}

/**
 * Removes a tenant's global configuration from Cloudflare KV.
 * Call when a tenant is deleted from the database.
 */
export async function removeTenantConfigFromKV(hostname: string): Promise<void> {
  const config = useRuntimeConfig()

  const accountId = config.cloudflareAccountId as string
  const namespaceId = config.cloudflareKvNamespaceId as string
  const apiToken = config.cloudflareApiToken as string

  if (!accountId || !namespaceId || !apiToken) return

  const kvKey = `tenant:${hostname}:config`
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(kvKey)}`

  try {
    await $fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${apiToken}` }
    })
    console.log(`[KV Sync] 🗑️ Removed config for tenant hostname "${hostname}" from KV key "${kvKey}"`)
  } catch (err) {
    console.error(`[KV Sync] ❌ Failed to delete tenant config from Cloudflare KV:`, err)
  }
}
