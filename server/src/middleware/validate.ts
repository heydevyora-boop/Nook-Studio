import type { NextFunction, Request, Response } from 'express'
import type { ZodSchema } from 'zod'
import { ApiError } from '../utils/ApiError'

interface ValidationSchemas {
  body?: ZodSchema
  query?: ZodSchema
  params?: ZodSchema
}

/** Validates/parses req.body, req.query and req.params against Zod schemas. */
export function validate({ body, query, params }: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (body) req.body = body.parse(req.body)
      if (query) req.query = query.parse(req.query) as typeof req.query
      if (params) req.params = params.parse(req.params) as typeof req.params
      next()
    } catch (error: any) {
      if (error?.issues) {
        next(ApiError.badRequest('Validation failed', error.flatten().fieldErrors))
      } else {
        next(error)
      }
    }
  }
}
