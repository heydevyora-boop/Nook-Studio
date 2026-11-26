import { Router } from 'express'
import { validate } from '../../middleware/validate'
import { journalController } from './journal.controller'
import { paginationQuerySchema, slugParamSchema } from './journal.schema'

const router = Router()

/**
 * @openapi
 * /journal:
 *   get:
 *     tags: [Journal]
 *     summary: List published journal posts
 *     responses:
 *       200: { description: Paginated list of published posts }
 */
router.get('/', validate({ query: paginationQuerySchema }), journalController.listPublished)

/**
 * @openapi
 * /journal/{slug}:
 *   get:
 *     tags: [Journal]
 *     summary: Get a single published journal post by slug
 *     responses:
 *       200: { description: The post }
 *       404: { description: Post not found }
 */
router.get('/:slug', validate({ params: slugParamSchema }), journalController.getBySlug)

export default router
