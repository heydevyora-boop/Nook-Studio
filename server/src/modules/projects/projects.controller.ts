import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/ApiResponse'
import { projectsService } from './projects.service'

export const projectsController = {
  listPublished: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, category, featured } = req.query as unknown as {
      page: number
      limit: number
      category?: any
      featured?: boolean
    }
    const { items, meta } = await projectsService.listPublished({ page, limit, category, featured })
    sendSuccess(res, items, 200, { meta })
  }),

  getBySlug: asyncHandler(async (req: Request, res: Response) => {
    const project = await projectsService.getPublishedBySlug(req.params.slug)
    sendSuccess(res, project)
  }),

  adminList: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, category, featured, status } = req.query as unknown as {
      page: number
      limit: number
      category?: any
      featured?: boolean
      status?: any
    }
    const { items, meta } = await projectsService.listAll({ page, limit, category, featured, status })
    sendSuccess(res, items, 200, { meta })
  }),

  adminGetById: asyncHandler(async (req: Request, res: Response) => {
    const project = await projectsService.getByIdOrThrow(req.params.id)
    sendSuccess(res, project)
  }),

  adminCreate: asyncHandler(async (req: Request, res: Response) => {
    const project = await projectsService.create(req.body)
    sendSuccess(res, project, 201, { message: 'Project created successfully' })
  }),

  adminUpdate: asyncHandler(async (req: Request, res: Response) => {
    const project = await projectsService.update(req.params.id, req.body)
    sendSuccess(res, project, 200, { message: 'Project updated successfully' })
  }),

  adminDelete: asyncHandler(async (req: Request, res: Response) => {
    await projectsService.softDelete(req.params.id)
    sendSuccess(res, { id: req.params.id }, 200, { message: 'Project deleted successfully' })
  }),
}
