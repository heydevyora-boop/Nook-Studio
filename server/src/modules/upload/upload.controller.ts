import type { Request, Response } from 'express'
import { asyncHandler } from '../../utils/asyncHandler'
import { sendSuccess } from '../../utils/ApiResponse'
import { ApiError } from '../../utils/ApiError'
import { uploadService } from './upload.service'

export const uploadController = {
  uploadSingle: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest('No file provided. Attach an image under the "file" field.')
    const result = await uploadService.uploadBuffer(req.file.buffer)
    sendSuccess(res, result, 201, { message: 'Image uploaded successfully' })
  }),
}
