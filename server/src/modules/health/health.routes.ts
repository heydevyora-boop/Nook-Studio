import { Router } from 'express'

const router = Router()

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Liveness/readiness probe
 *     responses:
 *       200: { description: Service is healthy }
 */
router.get('/', (_req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok', uptime: process.uptime() } })
})

export default router
