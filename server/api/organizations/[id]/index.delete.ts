import { eq } from 'drizzle-orm'
import { organizations } from '../../../database/schema'
import { removeOrganizationCampaignsFromKV, removeOrganizationConfigFromKV } from '../../../utils/kv-sync'

export default defineEventHandler(async (event) => {
  // Guard: only Super Admins may delete organizations
  if (!isSuperAdmin(event)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Super Admin access required to delete an organization'
    })
  }

  const id = getRouterParam(event, 'id')
  const db = useDB()

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing organization ID'
    })
  }

  // 1. Fetch organization first to get hostname (needed for KV cleanup)
  const [organization] = await db.select().from(organizations).where(eq(organizations.id, id))

  if (!organization) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Organization not found'
    })
  }

  try {
    // 2. Delete from Postgres
    // NOTE: This will automatically delete all related campaigns because of onDelete: 'cascade'
    await db.delete(organizations).where(eq(organizations.id, id))

    // 3. Clean up Cloudflare KV
    // We do this in parallel but don't strictly await if we want speed,
    // though for deletion it's better to ensure it's gone.
    await Promise.all([
      removeOrganizationCampaignsFromKV(id),
      removeOrganizationConfigFromKV(organization.hostname)
    ])

    return {
      success: true,
      message: `Organization ${id} and all related data removed successfully`
    }
  } catch (err: unknown) {
    console.error(`[Organization Delete] Failed to remove organization ${id}:`, err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error during deletion',
      data: err instanceof Error ? err.message : String(err)
    })
  }
})
