import { Router } from 'express'
import { servicesController } from './services.controller'

const router = Router()

/**
 * @openapi
 * /services:
 *   get:
 *     tags: [Services]
 *     summary: List all active services
 *     responses:
 *       200: { description: List of active services, ordered by `order` }
 */
router.get('/', servicesController.listActive)

export default router
