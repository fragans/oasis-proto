import { processJourneyExecutions } from '../utils/journey-engine'

const POLL_INTERVAL_MS = 30_000 // 30 seconds

export default defineNitroPlugin(() => {
  let timer: ReturnType<typeof setInterval> | null = null

  // Start polling after a short delay to let the server fully initialize
  setTimeout(() => {
    timer = setInterval(async () => {
      try {
        const processed = await processJourneyExecutions()
        if (processed > 0) {
          console.info(`[journey-scheduler] Processed ${processed} executions`)
        }
      } catch {
        // Engine errors are logged per-execution; ignore top-level polling errors
      }
    }, POLL_INTERVAL_MS)
  }, 5000)

  // Cleanup on process exit
  process.on('beforeExit', () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  })
})
