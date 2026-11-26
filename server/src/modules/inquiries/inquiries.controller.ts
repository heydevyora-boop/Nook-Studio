import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/ApiResponse'
import { inquiriesService } from './inquiries.service'

export const inquiriesController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const inquiry = await inquiriesService.create(req.body)
    sendSuccess(res, inquiry, 201, {
      message: "Thank you — your inquiry has been received. We'll be in touch shortly.",
    })
  }),

  adminList: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, status } = req.query as unknown as {
      page: number
      limit: number
      status?: any
    }
    const { items, meta } = await inquiriesService.listAll(page, limit, status)
    sendSuccess(res, items, 200, { meta })
  }),

  adminUpdateStatus: asyncHandler(async (req: Request, res: Response) => {
    const inquiry = await inquiriesService.updateStatus(req.params.id, req.body.status)
    sendSuccess(res, inquiry, 200, { message: 'Inquiry status updated successfully' })
  }),
}
