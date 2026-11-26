import { Router } from 'express'
import { requireAdmin } from '../../middleware/auth'
import { uploadImage } from './upload.middleware'
import { uploadController } from './upload.controller'

const router = Router()

/**
 * @openapi
 * /admin/upload:
 *   post:
 *     tags: [Admin - Upload]
 *     summary: Upload an image to Cloudinary
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201: { description: Uploaded image URL and public id }
 *       400: { description: No file provided or unsupported type }
 *       401: { description: Not authenticated }
 */
router.post('/', ...requireAdmin, uploadImage.single('file'), uploadController.uploadSingle)

export default router
