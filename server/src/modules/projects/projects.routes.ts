import { Router } from 'express'
import { validate } from '../../middleware/validate'
import { projectsController } from './projects.controller'
import { publicProjectsQuerySchema, slugParamSchema } from './projects.schema'

const router = Router()

/**
 * @openapi
 * /projects:
 *   get:
 *     tags: [Projects]
 *     summary: List published projects
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [INTERIOR_DESIGN, PRODUCT_DESIGN, SPACE_PLANNING, DESIGN_CONSULTATION] }
 *       - in: query
 *         name: featured
 *         schema: { type: boolean }
 *     responses:
 *       200: { description: Paginated list of published projects }
 */
router.get('/', validate({ query: publicProjectsQuerySchema }), projectsController.listPublished)

/**
 * @openapi
 * /projects/{slug}:
 *   get:
 *     tags: [Projects]
 *     summary: Get a single published project by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: The project }
 *       404: { description: Project not found }
 */
router.get('/:slug', validate({ params: slugParamSchema }), projectsController.getBySlug)

export default router
