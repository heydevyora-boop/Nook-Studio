import { Router } from 'express'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { testimonialsController } from './testimonials.controller'
import { createTestimonialSchema, idParamSchema, updateTestimonialSchema } from './testimonials.schema'

const router = Router()

router.use(...requireAdmin)

/**
 * @openapi
 * /admin/testimonials:
 *   get:
 *     tags: [Admin - Testimonials]
 *     summary: List all testimonials (active and inactive)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of testimonials }
 *   post:
 *     tags: [Admin - Testimonials]
 *     summary: Create a testimonial
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Testimonial created }
 */
router.get('/', testimonialsController.adminList)
router.post('/', validate({ body: createTestimonialSchema }), testimonialsController.adminCreate)

/**
 * @openapi
 * /admin/testimonials/{id}:
 *   get:
 *     tags: [Admin - Testimonials]
 *     summary: Get a testimonial by id
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: The testimonial }
 *   patch:
 *     tags: [Admin - Testimonials]
 *     summary: Update a testimonial
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Testimonial updated }
 *   delete:
 *     tags: [Admin - Testimonials]
 *     summary: Soft-delete a testimonial
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Testimonial deleted }
 */
router.get('/:id', validate({ params: idParamSchema }), testimonialsController.adminGetById)
router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateTestimonialSchema }),
  testimonialsController.adminUpdate,
)
router.delete('/:id', validate({ params: idParamSchema }), testimonialsController.adminDelete)

export default router
