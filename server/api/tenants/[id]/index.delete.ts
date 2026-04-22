import { eq } from 'drizzle-orm'
import { tenants } from '../../../database/schema'
import { removeTenantCampaignsFromKV, removeTenantConfigFromKV } from '../../../utils/kv-sync'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db = useDB()

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing tenant ID'
    })
  }

  // 1. Fetch tenant first to get hostname (needed for KV cleanup)
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id))

  if (!tenant) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Tenant not found'
    })
  }

  try {
    // 2. Delete from Postgres
    // NOTE: This will automatically delete all related campaigns because of onDelete: 'cascade'
    await db.delete(tenants).where(eq(tenants.id, id))

    // 3. Clean up Cloudflare KV
    // We do this in parallel but don't strictly await if we want speed,
    // though for deletion it's better to ensure it's gone.
    await Promise.all([
      removeTenantCampaignsFromKV(id),
      removeTenantConfigFromKV(tenant.hostname)
    ])

    return {
      success: true,
      message: `Tenant ${id} and all related data removed successfully`
    }
  } catch (err: unknown) {
    console.error(`[Tenant Delete] Failed to remove tenant ${id}:`, err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error during deletion',
      data: err instanceof Error ? err.message : String(err)
    })
  }
})
