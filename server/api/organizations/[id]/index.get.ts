import { eq } from 'drizzle-orm'
import { organizations } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db = useDB()

  if (!isSuperAdmin(event)) {
    const contextOrgId = requireOrganizationId(event)
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

  const [organization] = await db.select().from(organizations).where(eq(organizations.id, id))

  if (!organization) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Organization not found'
    })
  }

  return { organization }
})
