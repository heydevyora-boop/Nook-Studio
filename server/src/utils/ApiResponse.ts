import type { Response } from 'express'
import type { PaginationMeta } from './pagination'

interface SuccessOptions {
  /** Optional human-readable confirmation, e.g. "Project created successfully". */
  message?: string
  meta?: PaginationMeta
}

/** Every success response follows `{ success: true, data, message?, meta? }`. */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200, options: SuccessOptions = {}) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(options.message ? { message: options.message } : {}),
    ...(options.meta ? { meta: options.meta } : {}),
  })
}
