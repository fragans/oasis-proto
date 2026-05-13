import { eq } from 'drizzle-orm'
import { organization as organizationTable } from '../../../database/schema'
import { requireOrganizationId, isSuperAdmin } from '../../../utils/organization'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
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

  const [organization] = await db.select().from(organizationTable).where(eq(organizationTable.id, id))

  if (!organization) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Organization not found'
    })
  }

  return { organization }
})
