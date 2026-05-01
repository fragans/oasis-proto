import { eq } from 'drizzle-orm'
import { organizations } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db = useDB()

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing organization ID'
    })
  }

  const [organization] = await db.select().from(organizations).where(eq(organizations.id, id))

  if (!organization) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Organization not found'
    })
  }

  return { organization }
})
