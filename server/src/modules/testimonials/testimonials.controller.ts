import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/ApiResponse'
import { testimonialsService } from './testimonials.service'

export const testimonialsController = {
  listActive: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await testimonialsService.listActive())
  }),

  adminList: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await testimonialsService.listAll())
  }),

  adminGetById: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await testimonialsService.getByIdOrThrow(req.params.id))
  }),

  adminCreate: asyncHandler(async (req: Request, res: Response) => {
    const testimonial = await testimonialsService.create(req.body)
    sendSuccess(res, testimonial, 201, { message: 'Testimonial created successfully' })
  }),

  adminUpdate: asyncHandler(async (req: Request, res: Response) => {
    const testimonial = await testimonialsService.update(req.params.id, req.body)
    sendSuccess(res, testimonial, 200, { message: 'Testimonial updated successfully' })
  }),

  adminDelete: asyncHandler(async (req: Request, res: Response) => {
    await testimonialsService.softDelete(req.params.id)
    sendSuccess(res, { id: req.params.id }, 200, { message: 'Testimonial deleted successfully' })
  }),
}
