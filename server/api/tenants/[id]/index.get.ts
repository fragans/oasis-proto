import { eq } from 'drizzle-orm'
import { tenants } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db = useDB()

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing tenant ID'
    })
  }

  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id))

  if (!tenant) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Tenant not found'
    })
  }

  return { tenant }
})
