import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { tenants } from '../database/schema'
import { eq } from 'drizzle-orm'

export default defineNitroPlugin(async () => {
  if (import.meta.dev) {
    try {
      const db = useDB()
      await migrate(db, {
        migrationsFolder: './server/database/migrations',
        migrationsTable: 'drizzle_migrations'
      })
      console.log('[DB] Migrations applied successfully')

      // Ensure default tenant exists
      const config = useRuntimeConfig()
      const tenantId = config.public.defaultTenantId as string

      if (tenantId && tenantId !== 'no-tenant') {
        const existing = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1)

        if (existing.length === 0) {
          console.log(`[DB] Seeding default tenant: ${tenantId}`)
          await db.insert(tenants).values({
            id: tenantId,
            hostname: 'localhost',
            apiUrl: 'http://localhost:3000',
            cookieName: 'oasis_guid',
            isLive: false
          })
        }
      }
    } catch (error) {
      console.error('[DB] Migration/Seed failed:', error)
    }
  }
})
