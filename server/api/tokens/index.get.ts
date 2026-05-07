// server/api/tokens/index.get.ts
import { desc, eq } from 'drizzle-orm'
import { apiTokens } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()

  const query = db.select({
    id: apiTokens.id,
    organizationId: apiTokens.organizationId,
    name: apiTokens.name,
    prefix: apiTokens.prefix,
    lastUsedAt: apiTokens.lastUsedAt,
    expiresAt: apiTokens.expiresAt,
    createdAt: apiTokens.createdAt
  }).from(apiTokens)

  if (!isSuperAdmin(event)) {
    const contextOrgId = requireOrganizationId(event)
    query.where(eq(apiTokens.organizationId, contextOrgId))
  }

  const rows = await query.orderBy(desc(apiTokens.createdAt))

  return { tokens: rows }
})
