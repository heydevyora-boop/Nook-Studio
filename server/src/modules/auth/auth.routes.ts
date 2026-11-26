import { Router } from 'express'
import { authController } from './auth.controller'
import { loginSchema, registerSchema } from './auth.schema'
import { validate } from '../../middleware/validate'
import { authRateLimiter } from '../../middleware/rateLimit'
import { requireAuth } from '../../middleware/auth'

const router = Router()

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register the first admin account (bootstrap only — disabled once a user exists)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, username, email, password]
 *             properties:
 *               name: { type: string }
 *               username: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201: { description: Admin account created }
 *       403: { description: Registration already closed }
 */
router.post('/register', validate({ body: registerSchema }), authController.register)

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in (admin, staff, or user — the role decides what the frontend allows)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Signed in successfully }
 *       401: { description: Invalid credentials }
 */
router.post('/login', authRateLimiter, validate({ body: loginSchema }), authController.login)

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current user }
 *       401: { description: Not authenticated }
 */
router.get('/me', requireAuth, authController.me)

export default router
