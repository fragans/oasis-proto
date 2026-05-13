import { eq } from 'drizzle-orm'
import { organization } from '../../database/schema'
import { getOrganizationId, isSuperAdmin } from '../../utils/organization'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const organizationId = await getOrganizationId(event)

  if (await isSuperAdmin(event)) {
    const allOrganizations = await db.select().from(organization)
    return { organizations: allOrganizations }
  }

  if (organizationId) {
    const orgs = await db.select().from(organization).where(eq(organization.id, organizationId))
    return { organizations: orgs }
  }

  return { organizations: [] }
})
