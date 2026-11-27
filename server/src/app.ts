import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import swaggerUi from 'swagger-ui-express'

import { env, isProduction } from './config/env'
import { swaggerSpec } from './config/swagger'
import routes from './routes'
import { apiRateLimiter } from './middleware/rateLimit'
import { notFound } from './middleware/notFound'
import { errorHandler } from './middleware/errorHandler'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  app.use(helmet())
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(morgan(isProduction ? 'combined' : 'dev'))
  app.use(apiRateLimiter)

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec))

  app.use('/api', routes)

  app.use(notFound)
  app.use(errorHandler)

  return app
}

// Vercel's Express framework builder loads this file directly as the
// serverless handler and requires a default export that is the Express app
// itself (an Express app is callable as `(req, res) => ...`, satisfying its
// "function or server" requirement). `index.ts` still uses the named
// `createApp` export for traditional `app.listen()` deployments (Docker/Render).
export default createApp()
