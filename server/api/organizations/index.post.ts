import { organization as organizationTable } from '../../database/schema'
import { createOrganizationSchema } from '~~/shared/types/organization'
import { syncOrganizationConfigToKV } from '../../utils/kv-sync'
import { isSuperAdmin } from '../../utils/organization'

export default defineEventHandler(async (event) => {
  if (!await isSuperAdmin(event)) {
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
    const [newOrg] = await db.insert(organizationTable).values({
      id: parsed.data.id,
      name: parsed.data.id, // Fallback to ID as name
      slug: parsed.data.id,
      hostname: parsed.data.hostname,
      apiUrl: parsed.data.apiUrl,
      cookieName: parsed.data.cookieName,
      isLive: false, // Default to maintenance
      createdAt: new Date()
    }).returning()

    if (!newOrg) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create organization'
      })
    }

    // Sync to KV immediately so the edge worker knows about this organization config
    try {
      await syncOrganizationConfigToKV(newOrg.id)
    } catch (kvErr) {
      console.error(`[API] Organization created but KV sync failed for ${newOrg.id}:`, kvErr)
      // We don't fail the request here, but the UI might show a warning
    }

    setResponseStatus(event, 201)
    return {
      success: true,
      organization: newOrg
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
