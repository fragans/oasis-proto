import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../database/schema'

let _db: ReturnType<typeof drizzle<typeof schema>>

export function useDB() {
  if (!_db) {
    const config = useRuntimeConfig()
    const client = postgres(config.databaseUrl)
    _db = drizzle(client, { schema })
  }
  return _db
}
