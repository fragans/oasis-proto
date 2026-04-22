import { tenants } from '../../database/schema'

export default defineEventHandler(async () => {
  const db = useDB()
  const allTenants = await db.select().from(tenants)
  return { tenants: allTenants }
})
