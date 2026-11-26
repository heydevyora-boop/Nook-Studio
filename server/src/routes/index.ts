import { Router } from 'express'

import healthRoutes from '../modules/health/health.routes'
import authRoutes from '../modules/auth/auth.routes'

import projectsRoutes from '../modules/projects/projects.routes'
import projectsAdminRoutes from '../modules/projects/projects.admin.routes'

import servicesRoutes from '../modules/services/services.routes'
import servicesAdminRoutes from '../modules/services/services.admin.routes'

import journalRoutes from '../modules/journal/journal.routes'
import journalAdminRoutes from '../modules/journal/journal.admin.routes'

import inquiriesRoutes from '../modules/inquiries/inquiries.routes'
import inquiriesAdminRoutes from '../modules/inquiries/inquiries.admin.routes'

import testimonialsRoutes from '../modules/testimonials/testimonials.routes'
import testimonialsAdminRoutes from '../modules/testimonials/testimonials.admin.routes'

import uploadAdminRoutes from '../modules/upload/upload.routes'

const router = Router()

// --- Public routes ---------------------------------------------------------
router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/projects', projectsRoutes)
router.use('/services', servicesRoutes)
router.use('/journal', journalRoutes)
router.use('/inquiries', inquiriesRoutes)
router.use('/testimonials', testimonialsRoutes)

// --- Admin routes (JWT-protected inside each router) ------------------------
router.use('/admin/projects', projectsAdminRoutes)
router.use('/admin/services', servicesAdminRoutes)
router.use('/admin/journal', journalAdminRoutes)
router.use('/admin/inquiries', inquiriesAdminRoutes)
router.use('/admin/testimonials', testimonialsAdminRoutes)
router.use('/admin/upload', uploadAdminRoutes)

export default router
