import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/ApiResponse'
import { authService } from './auth.service'

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body)
    sendSuccess(res, result, 201, { message: 'Admin account created successfully' })
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body)
    sendSuccess(res, result, 200, { message: 'Login successful' })
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getCurrentUser(req.user!.id)
    sendSuccess(res, { user })
  }),
}
