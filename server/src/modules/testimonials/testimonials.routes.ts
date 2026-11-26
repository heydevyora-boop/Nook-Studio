import { Router } from 'express'
import { testimonialsController } from './testimonials.controller'

const router = Router()

/**
 * @openapi
 * /testimonials:
 *   get:
 *     tags: [Testimonials]
 *     summary: List all active testimonials
 *     responses:
 *       200: { description: List of active testimonials }
 */
router.get('/', testimonialsController.listActive)

export default router
