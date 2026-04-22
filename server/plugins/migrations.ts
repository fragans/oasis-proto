import { migrate } from 'drizzle-orm/postgres-js/migrator'

export default defineNitroPlugin(async () => {
  if (import.meta.dev) {
    try {
      const db = useDB()
      await migrate(db, {
        migrationsFolder: './server/database/migrations',
        migrationsTable: 'drizzle_migrations'
      })
      console.log('[DB] Migrations applied successfully')
    } catch (error) {
      console.error('[DB] Migration failed:', error)
    }
  }
})
