import { api } from '../lib/api'
import type { AdminUser, ApiSuccess } from '../types/api'
import type { LoginFormValues } from '../lib/schemas'

export async function login(payload: LoginFormValues): Promise<{ user: AdminUser; token: string }> {
  const res = await api.post<ApiSuccess<{ user: AdminUser; token: string }>>('/auth/login', payload)
  return res.data.data
}

export async function fetchCurrentUser(): Promise<AdminUser> {
  const res = await api.get<ApiSuccess<{ user: AdminUser }>>('/auth/me')
  return res.data.data.user
}
