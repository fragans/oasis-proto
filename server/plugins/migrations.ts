import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { organizations } from '../database/schema'
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

      // Ensure default organization exists
      const config = useRuntimeConfig()
      const organizationId = config.public.defaultOrganizationId as string

      if (organizationId && organizationId !== 'no-organization') {
        const existing = await db.select().from(organizations).where(eq(organizations.id, organizationId)).limit(1)

        if (existing.length === 0) {
          console.log(`[DB] Seeding default organization: ${organizationId}`)
          await db.insert(organizations).values({
            id: organizationId,
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
