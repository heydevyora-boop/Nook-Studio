import { PrismaClient } from '@prisma/client'
import { env } from '../config/env'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

// Reuse a single PrismaClient instance across module reloads (important in
// dev with tsx watch) to avoid exhausting the Postgres connection pool.
export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (env.NODE_ENV !== 'production') {
  global.__prisma = prisma
}
