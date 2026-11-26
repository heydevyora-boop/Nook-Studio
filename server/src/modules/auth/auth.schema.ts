import { z } from 'zod'

const usernameField = z
  .string()
  .min(1, 'Username is required')
  .regex(/^[a-z0-9_.-]+$/i, 'Username may only contain letters, numbers, dots, hyphens and underscores')

export const loginSchema = z.object({
  username: usernameField,
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: usernameField,
  email: z.string().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
