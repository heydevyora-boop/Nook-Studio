import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import type { Role } from '@prisma/client'
import { env } from '../config/env'
import { ApiError } from '../utils/ApiError'

interface JwtPayload {
  sub: string
  username: string
  role: Role
}

/** Verifies the Bearer JWT and attaches the decoded user to `req.user`. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing or malformed Authorization header'))
  }

  const token = header.slice('Bearer '.length)

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    req.user = { id: payload.sub, username: payload.username, role: payload.role }
    next()
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'))
  }
}

/** Restricts access to the given roles. Use after `requireAuth`. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized())
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden('Insufficient permissions'))
    next()
  }
}

export const requireAdmin = [requireAuth, requireRole('ADMIN')]
