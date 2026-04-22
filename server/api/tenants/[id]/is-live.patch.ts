import { eq } from 'drizzle-orm'
import { tenants } from '../../../database/schema'
import { syncTenantConfigToKV } from '../../../utils/kv-sync'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const db = useDB()

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing tenant ID'
    })
  }

  const { isLive } = body

  if (typeof isLive !== 'boolean') {
    throw createError({
      statusCode: 400,
      statusMessage: 'isLive must be a boolean'
    })
  }

  // 1. Update database
  const updated = await db.update(tenants)
    .set({
      isLive,
      updatedAt: new Date()
    })
    .where(eq(tenants.id, id))
    .returning()

  if (updated.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Tenant not found'
    })
  }

  // 2. Sync to KV
  try {
    await syncTenantConfigToKV(id)
  } catch (err) {
    // We still return success for DB update, but warn about sync failure
    console.error(`[API] Failed to sync tenant ${id} to KV:`, err)
    return {
      success: true,
      tenant: updated[0],
      syncError: 'Failed to sync to Edge (KV)'
    }
  }

  return {
    success: true,
    tenant: updated[0],
    syncError: null as string | null
  }
})
