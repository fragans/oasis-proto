import { eq } from 'drizzle-orm'
import { organizations } from '../../database/schema'
import { getOrganizationId } from '../../utils/organization'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const organizationId = getOrganizationId(event)
  const isSuperAdmin = getHeader(event, 'x-oasis-super-admin') === 'true'

  if (isSuperAdmin) {
    const allOrganizations = await db.select().from(organizations)
    return { organizations: allOrganizations }
  }

  if (organizationId) {
    const orgs = await db.select().from(organizations).where(eq(organizations.id, organizationId))
    return { organizations: orgs }
  }

  return { organizations: [] }
})
