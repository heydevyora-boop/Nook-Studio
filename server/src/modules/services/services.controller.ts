import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/ApiResponse'
import { servicesService } from './services.service'

export const servicesController = {
  listActive: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await servicesService.listActive())
  }),

  adminList: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await servicesService.listAll())
  }),

  adminGetById: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await servicesService.getByIdOrThrow(req.params.id))
  }),

  adminCreate: asyncHandler(async (req: Request, res: Response) => {
    const service = await servicesService.create(req.body)
    sendSuccess(res, service, 201, { message: 'Service created successfully' })
  }),

  adminUpdate: asyncHandler(async (req: Request, res: Response) => {
    const service = await servicesService.update(req.params.id, req.body)
    sendSuccess(res, service, 200, { message: 'Service updated successfully' })
  }),

  adminDelete: asyncHandler(async (req: Request, res: Response) => {
    await servicesService.softDelete(req.params.id)
    sendSuccess(res, { id: req.params.id }, 200, { message: 'Service deleted successfully' })
  }),
}
