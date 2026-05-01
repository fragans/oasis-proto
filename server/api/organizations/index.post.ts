import { organizations } from '../../database/schema'
import { createOrganizationSchema } from '~~/shared/types/organization'
import { syncOrganizationConfigToKV } from '../../utils/kv-sync'

export default defineEventHandler(async (event) => {
  const isSuperAdmin = getHeader(event, 'x-oasis-super-admin') === 'true'
  if (!isSuperAdmin) {
    throw createError({
      statusCode: 403,
      message: 'Only Super Admins can create new organizations.'
    })
  }

  const db = useDB()
  const body = await readBody(event)

  const parsed = createOrganizationSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Validation failed',
      data: parsed.error.flatten()
    })
  }

  try {
    const [organization] = await db.insert(organizations).values({
      id: parsed.data.id,
      hostname: parsed.data.hostname,
      apiUrl: parsed.data.apiUrl,
      cookieName: parsed.data.cookieName,
      authCookieNames: parsed.data.authCookieNames,
      isLive: false // Default to maintenance
    }).returning()

    if (!organization) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create organization'
      })
    }

    // Sync to KV immediately so the edge worker knows about this organization config
    try {
      await syncOrganizationConfigToKV(organization.id)
    } catch (kvErr) {
      console.error(`[API] Organization created but KV sync failed for ${organization.id}:`, kvErr)
      // We don't fail the request here, but the UI might show a warning
    }

    setResponseStatus(event, 201)
    return {
      success: true,
      organization
    }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === '23505') { // Unique constraint violation
      throw createError({
        statusCode: 409,
        statusMessage: 'Organization ID or Hostname already exists'
      })
    }
    throw err
  }
})
