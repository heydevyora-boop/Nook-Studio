import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/ApiResponse'
import { journalService } from './journal.service'

export const journalController = {
  listPublished: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number }
    const { items, meta } = await journalService.listPublished(page, limit)
    sendSuccess(res, items, 200, { meta })
  }),

  getBySlug: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await journalService.getPublishedBySlug(req.params.slug))
  }),

  adminList: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number }
    const { items, meta } = await journalService.listAll(page, limit)
    sendSuccess(res, items, 200, { meta })
  }),

  adminGetById: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await journalService.getByIdOrThrow(req.params.id))
  }),

  adminCreate: asyncHandler(async (req: Request, res: Response) => {
    const post = await journalService.create(req.body, req.user?.id)
    sendSuccess(res, post, 201, { message: 'Journal post created successfully' })
  }),

  adminUpdate: asyncHandler(async (req: Request, res: Response) => {
    const post = await journalService.update(req.params.id, req.body)
    sendSuccess(res, post, 200, { message: 'Journal post updated successfully' })
  }),

  adminDelete: asyncHandler(async (req: Request, res: Response) => {
    await journalService.softDelete(req.params.id)
    sendSuccess(res, { id: req.params.id }, 200, { message: 'Journal post deleted successfully' })
  }),
}
