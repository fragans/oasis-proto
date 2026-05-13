import { sql } from 'drizzle-orm'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default defineEventHandler(async (event) => {
  const db = useDB()

  try {
    const queries = [
      `ALTER TABLE "api_tokens" DROP CONSTRAINT IF EXISTS "api_tokens_organization_id_organizations_id_fk"`,
      `ALTER TABLE "campaigns" DROP CONSTRAINT IF EXISTS "campaigns_organization_id_organizations_id_fk"`,
      `ALTER TABLE "creatives" DROP CONSTRAINT IF EXISTS "creatives_organization_id_organizations_id_fk"`,
      `ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_organization_id_organizations_id_fk"`,
      `ALTER TABLE "organizations" DISABLE ROW LEVEL SECURITY`,
      `DROP TABLE IF EXISTS "organizations" CASCADE`
    ]

    for (const query of queries) {
      await db.execute(sql.raw(query))
      console.log(`Executed: ${query}`)
    }

    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'cleanup-db error' }
  }
})
