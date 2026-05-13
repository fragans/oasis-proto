import { eq } from 'drizzle-orm'
import { organization as organizationTable } from '../../../database/schema'
import { syncOrganizationConfigToKV } from '../../../utils/kv-sync'
import { requireOrganizationId, isSuperAdmin } from '../../../utils/organization'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const db = useDB()

  if (!await isSuperAdmin(event)) {
    const contextOrgId = await requireOrganizationId(event)
    if (id !== contextOrgId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: You do not have access to this organization'
      })
    }
  }

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing organization ID'
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
  const updated = await db.update(organizationTable)
    .set({
      isLive
    })
    .where(eq(organizationTable.id, id))
    .returning()

  if (updated.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Organization not found'
    })
  }

  // 2. Sync to KV
  try {
    await syncOrganizationConfigToKV(id)
  } catch (err) {
    // We still return success for DB update, but warn about sync failure
    console.error(`[API] Failed to sync organization ${id} to KV:`, err)
    return {
      success: true,
      organization: updated[0],
      syncError: 'Failed to sync to Edge (KV)'
    }
  }

  return {
    success: true,
    organization: updated[0],
    syncError: null as string | null
  }
})
