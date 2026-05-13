import { organization, member, user } from '../../database/schema'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default defineEventHandler(async (event) => {
  const db = useDB()

  try {
    // 1. Fetch old organizations
    const oldOrgs = await db.select().from(organization)
    console.log(`Found ${oldOrgs.length} old organizations`)

    for (const oldOrg of oldOrgs) {
      // 2. Insert into new organization table
      // We use the old ID as BOTH id and slug to maintain foreign key integrity
      await db.insert(organization).values({
        id: oldOrg.id,
        name: oldOrg.id, // Using ID as name as fallback
        slug: oldOrg.id,
        hostname: oldOrg.hostname,
        cookieName: oldOrg.cookieName,
        apiUrl: oldOrg.apiUrl,
        isLive: oldOrg.isLive,
        createdAt: new Date()
      }).onConflictDoNothing()

      console.log(`Migrated organization: ${oldOrg.id}`)
    }

    // 3. Migrate user memberships
    const allUsers = await db.select().from(user)
    for (const u of allUsers) {
      if (u.organizationId) {
        // Create a membership record
        await db.insert(member).values({
          id: `mem_${u.id}_${u.organizationId}`,
          organizationId: u.organizationId,
          userId: u.id,
          role: u.role === 'admin' || u.role === 'super_admin' ? 'admin' : 'member',
          createdAt: new Date()
        }).onConflictDoNothing()

        console.log(`Created membership for user ${u.email} in ${u.organizationId}`)
      }
    }

    return {
      success: true,
      message: 'Migration completed successfully'
    }
  } catch (error: unknown) {
    console.error('Migration failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed'
    }
  }
})
