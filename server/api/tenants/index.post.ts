import { tenants } from '../../database/schema'
import { createTenantSchema } from '~~/shared/types/tenant'
import { syncTenantConfigToKV } from '../../utils/kv-sync'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)

  const parsed = createTenantSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Validation failed',
      data: parsed.error.flatten()
    })
  }

  try {
    const [tenant] = await db.insert(tenants).values({
      id: parsed.data.id,
      hostname: parsed.data.hostname,
      apiUrl: parsed.data.apiUrl,
      cookieName: parsed.data.cookieName,
      authCookieNames: parsed.data.authCookieNames,
      isLive: false // Default to maintenance
    }).returning()

    // Sync to KV immediately so the edge worker knows about this tenant config
    try {
      await syncTenantConfigToKV(tenant.id)
    } catch (kvErr) {
      console.error(`[API] Tenant created but KV sync failed for ${tenant.id}:`, kvErr)
      // We don't fail the request here, but the UI might show a warning
    }

    setResponseStatus(event, 201)
    return {
      success: true,
      tenant
    }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === '23505') { // Unique constraint violation
      throw createError({
        statusCode: 409,
        statusMessage: 'Tenant ID or Hostname already exists'
      })
    }
    throw err
  }
})
