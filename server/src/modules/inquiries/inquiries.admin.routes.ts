import { Router } from 'express'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { inquiriesController } from './inquiries.controller'
import { adminInquiriesQuerySchema, idParamSchema, updateInquiryStatusSchema } from './inquiries.schema'

const router = Router()

router.use(...requireAdmin)

/**
 * @openapi
 * /admin/inquiries:
 *   get:
 *     tags: [Admin - Inquiries]
 *     summary: List inquiries, optionally filtered by status
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Paginated list of inquiries }
 */
router.get('/', validate({ query: adminInquiriesQuerySchema }), inquiriesController.adminList)

/**
 * @openapi
 * /admin/inquiries/{id}:
 *   patch:
 *     tags: [Admin - Inquiries]
 *     summary: Update an inquiry's status
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [NEW, CONTACTED, CLOSED] }
 *     responses:
 *       200: { description: Inquiry updated }
 */
router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateInquiryStatusSchema }),
  inquiriesController.adminUpdateStatus,
)

export default router
