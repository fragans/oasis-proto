import { deploymentInfo } from '~~/server/database/schema'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const { commitShaShort, commitShaFull, branch } = body

    if (!commitShaShort || !commitShaFull || !branch) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: commitShaShort, commitShaFull, branch'
      })
    }

    // Detect environment from branch
    const environment = branch === 'main' ? 'production' : 'staging'

    const db = useDB()

    // Save to database
    const result = await db.insert(deploymentInfo).values({
      commitShaShort,
      commitShaFull,
      branch,
      environment,
      pushedAt: new Date(),
      createdAt: new Date()
    }).returning()

    return {
      success: true,
      data: result[0]
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing required fields')) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to save deployment info'
    })
  }
})
