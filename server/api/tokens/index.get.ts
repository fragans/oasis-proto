import { desc } from 'drizzle-orm'
import { apiTokens } from '../../database/schema'

export default defineEventHandler(async () => {
  const db = useDB()
  const rows = await db.select({
    id: apiTokens.id,
    name: apiTokens.name,
    prefix: apiTokens.prefix,
    lastUsedAt: apiTokens.lastUsedAt,
    expiresAt: apiTokens.expiresAt,
    createdAt: apiTokens.createdAt
  }).from(apiTokens).orderBy(desc(apiTokens.createdAt))

  return { tokens: rows }
})
