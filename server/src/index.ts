import { createApp } from './app'
import { env } from './config/env'
import { prisma } from './lib/prisma'
import { logger } from './lib/logger'
import { startSheetsSyncWorker } from './modules/inquiries/inquiries.sheetsSync'

const app = createApp()

const server = app.listen(env.PORT, () => {
  logger.info(`NOOKK STUDIO API listening on port ${env.PORT} (${env.NODE_ENV})`)
  logger.info(`API docs available at http://localhost:${env.PORT}/api/docs`)
})

const stopSheetsSyncWorker = startSheetsSyncWorker()

async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`)
  stopSheetsSyncWorker()
  server.close(async () => {
    await prisma.$disconnect()
    logger.info('Shutdown complete')
    process.exit(0)
  })

  // Force-exit if connections don't close in time.
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', reason)
})
