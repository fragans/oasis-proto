import { eq, and, type SQL } from 'drizzle-orm'
import { apiTokens } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = getRouterParam(event, 'id')!

  let filter: SQL = eq(apiTokens.id, id)

  if (!isSuperAdmin(event)) {
    const contextOrgId = requireOrganizationId(event)
    filter = and(eq(apiTokens.id, id), eq(apiTokens.organizationId, contextOrgId))!
  }

  const [deleted] = await db.delete(apiTokens).where(filter).returning()

  if (!deleted) {
    throw createError({ statusCode: 404, message: 'Token not found' })
  }

  return { success: true }
})
