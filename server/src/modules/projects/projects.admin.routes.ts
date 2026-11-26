import { Router } from 'express'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { projectsController } from './projects.controller'
import {
  adminProjectsQuerySchema,
  createProjectSchema,
  idParamSchema,
  updateProjectSchema,
} from './projects.schema'

const router = Router()

router.use(...requireAdmin)

/**
 * @openapi
 * /admin/projects:
 *   get:
 *     tags: [Admin - Projects]
 *     summary: List all projects (any status), with filters
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Paginated list of projects }
 *   post:
 *     tags: [Admin - Projects]
 *     summary: Create a project
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Project created }
 */
router.get('/', validate({ query: adminProjectsQuerySchema }), projectsController.adminList)
router.post('/', validate({ body: createProjectSchema }), projectsController.adminCreate)

/**
 * @openapi
 * /admin/projects/{id}:
 *   get:
 *     tags: [Admin - Projects]
 *     summary: Get a project by id
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: The project }
 *   patch:
 *     tags: [Admin - Projects]
 *     summary: Update a project
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Project updated }
 *   delete:
 *     tags: [Admin - Projects]
 *     summary: Soft-delete a project
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Project deleted }
 */
router.get('/:id', validate({ params: idParamSchema }), projectsController.adminGetById)
router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateProjectSchema }),
  projectsController.adminUpdate,
)
router.delete('/:id', validate({ params: idParamSchema }), projectsController.adminDelete)

export default router
