import { Router } from 'express'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { journalController } from './journal.controller'
import {
  createJournalSchema,
  idParamSchema,
  paginationQuerySchema,
  updateJournalSchema,
} from './journal.schema'

const router = Router()

router.use(...requireAdmin)

/**
 * @openapi
 * /admin/journal:
 *   get:
 *     tags: [Admin - Journal]
 *     summary: List all journal posts (published and drafts)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Paginated list of posts }
 *   post:
 *     tags: [Admin - Journal]
 *     summary: Create a journal post
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Post created }
 */
router.get('/', validate({ query: paginationQuerySchema }), journalController.adminList)
router.post('/', validate({ body: createJournalSchema }), journalController.adminCreate)

/**
 * @openapi
 * /admin/journal/{id}:
 *   get:
 *     tags: [Admin - Journal]
 *     summary: Get a journal post by id
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: The post }
 *   patch:
 *     tags: [Admin - Journal]
 *     summary: Update a journal post
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Post updated }
 *   delete:
 *     tags: [Admin - Journal]
 *     summary: Soft-delete a journal post
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Post deleted }
 */
router.get('/:id', validate({ params: idParamSchema }), journalController.adminGetById)
router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateJournalSchema }),
  journalController.adminUpdate,
)
router.delete('/:id', validate({ params: idParamSchema }), journalController.adminDelete)

export default router
