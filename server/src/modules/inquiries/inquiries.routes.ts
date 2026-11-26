import { Router } from 'express'
import { validate } from '../../middleware/validate'
import { inquiryRateLimiter } from '../../middleware/rateLimit'
import { inquiriesController } from './inquiries.controller'
import { createInquirySchema } from './inquiries.schema'

const router = Router()

/**
 * @openapi
 * /inquiries:
 *   post:
 *     tags: [Inquiries]
 *     summary: Submit a contact / consultation request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, message]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               projectType: { type: string }
 *               budget: { type: string }
 *               message: { type: string }
 *     responses:
 *       201: { description: Inquiry received }
 *       429: { description: Rate limit exceeded }
 */
router.post('/', inquiryRateLimiter, validate({ body: createInquirySchema }), inquiriesController.create)

export default router
