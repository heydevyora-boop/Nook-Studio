import type { NextFunction, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { ApiError } from '../utils/ApiError'
import { logger } from '../lib/logger'
import { isProduction } from '../config/env'

/** Central error handler — must be registered last, after all routes. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) logger.error(err.message, { path: req.path, stack: err.stack })
    return res.status(err.statusCode).json({
      success: false,
      data: null,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    })
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta?.target.join(', ') : 'field'
      return res
        .status(409)
        .json({ success: false, data: null, message: `A record with this ${target} already exists.` })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, data: null, message: 'Resource not found.' })
    }
  }

  logger.error('Unhandled error', { path: req.path, error: err })

  return res.status(500).json({
    success: false,
    data: null,
    message: isProduction ? 'Internal server error' : (err as Error)?.message || 'Internal server error',
  })
}
