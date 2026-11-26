import bcrypt from 'bcryptjs'
import jwt, { type SignOptions } from 'jsonwebtoken'
import type { Role } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { env } from '../../config/env'
import { ApiError } from '../../utils/ApiError'
import type { LoginInput, RegisterInput } from './auth.schema'

const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  username: true,
  email: true,
  role: true,
  createdAt: true,
} as const

function signToken(user: { id: string; username: string; role: Role }) {
  return jwt.sign({ sub: user.id, username: user.username, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions)
}

export const authService = {
  /**
   * Registration is intentionally bootstrap-only: it succeeds exactly once,
   * to create the first administrator. Once any user exists, it is locked.
   * (In this project the three demo accounts are normally created by
   * `prisma/seed.ts` instead, which also leaves this endpoint locked.)
   */
  async register(input: RegisterInput) {
    const existingAdminCount = await prisma.user.count()
    if (existingAdminCount > 0) {
      throw ApiError.forbidden(
        'Admin registration is closed. Ask an existing administrator to manage access.',
      )
    }

    const [usernameTaken, emailTaken] = await Promise.all([
      prisma.user.findUnique({ where: { username: input.username } }),
      prisma.user.findUnique({ where: { email: input.email } }),
    ])
    if (usernameTaken) throw ApiError.conflict('An account with this username already exists.')
    if (emailTaken) throw ApiError.conflict('An account with this email already exists.')

    const hashed = await bcrypt.hash(input.password, 12)
    const user = await prisma.user.create({
      data: { name: input.name, username: input.username, email: input.email, password: hashed },
      select: PUBLIC_USER_SELECT,
    })

    return { user, token: signToken(user) }
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { username: input.username } })
    if (!user) throw ApiError.unauthorized('Invalid username or password')

    const passwordMatches = await bcrypt.compare(input.password, user.password)
    if (!passwordMatches) throw ApiError.unauthorized('Invalid username or password')

    const { password: _password, ...publicUser } = user
    return { user: publicUser, token: signToken(user) }
  },

  async getCurrentUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id }, select: PUBLIC_USER_SELECT })
    if (!user) throw ApiError.unauthorized('Account no longer exists')
    return user
  },
}
