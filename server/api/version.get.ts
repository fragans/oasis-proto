import { desc } from 'drizzle-orm'
import { deploymentInfo } from '~~/server/database/schema'

export default defineEventHandler(async () => {
  try {
    const db = useDB()

    // Get the latest deployment info
    const latest = await db
      .select()
      .from(deploymentInfo)
      .orderBy(desc(deploymentInfo.pushedAt))
      .limit(1)

    if (latest.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No deployment info found. Push a commit first.'
      })
    }

    const info = latest[0]

    return {
      commit: info.commitShaShort,
      commit_full: info.commitShaFull,
      branch: info.branch,
      environment: info.environment,
      pushed_at: info.pushedAt
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('deployment info')) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to retrieve version information'
    })
  }
})
