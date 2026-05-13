import { eq } from 'drizzle-orm'
import { user, organization } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  // Ensure the user is a super_admin
  await requireUserSession(event, {
    user: { role: 'super_admin' }
  })

  const db = useDB()

  // Fetch all users with their organization name
  const allUsers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: organization.hostname,
      createdAt: user.createdAt
    })
    .from(user)
    .leftJoin(organization, eq(user.organizationId, organization.id))
    .orderBy(user.createdAt)

  return { users: allUsers }
})
