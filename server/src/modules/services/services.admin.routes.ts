import { Router } from 'express'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { servicesController } from './services.controller'
import { createServiceSchema, idParamSchema, updateServiceSchema } from './services.schema'

const router = Router()

router.use(...requireAdmin)

/**
 * @openapi
 * /admin/services:
 *   get:
 *     tags: [Admin - Services]
 *     summary: List all services (active and inactive)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of services }
 *   post:
 *     tags: [Admin - Services]
 *     summary: Create a service
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Service created }
 */
router.get('/', servicesController.adminList)
router.post('/', validate({ body: createServiceSchema }), servicesController.adminCreate)

/**
 * @openapi
 * /admin/services/{id}:
 *   get:
 *     tags: [Admin - Services]
 *     summary: Get a service by id
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: The service }
 *   patch:
 *     tags: [Admin - Services]
 *     summary: Update a service
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Service updated }
 *   delete:
 *     tags: [Admin - Services]
 *     summary: Soft-delete a service
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Service deleted }
 */
router.get('/:id', validate({ params: idParamSchema }), servicesController.adminGetById)
router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateServiceSchema }),
  servicesController.adminUpdate,
)
router.delete('/:id', validate({ params: idParamSchema }), servicesController.adminDelete)

export default router
