import axios, { AxiosError } from 'axios'
import type { ApiFailure } from '../types/api'

export const TOKEN_STORAGE_KEY = 'nookk_admin_token'

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch {
    // Storage can be unavailable (private browsing, quota); the session
    // simply won't persist across reloads, which is an acceptable fallback.
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    // no-op
  }
}

/** Normalized client-side error with the backend's message and field details, if any. */
export class ApiClientError extends Error {
  readonly status?: number
  readonly details?: Record<string, string[]>

  constructor(message: string, status?: number, details?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.details = details
  }
}

// Falls back to a relative '/api' (not an absolute localhost URL) so that,
// when VITE_API_URL is left unset in a deployment such as Vercel's
// multi-service rewrites (see vercel.json), requests stay same-origin and
// the '/api/*' rewrite to the backend service just works. Local dev sets
// VITE_API_URL explicitly (see .env.example) to point at the dev server.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

type AuthExpiredListener = () => void
let onAuthExpired: AuthExpiredListener | null = null

/** Lets AuthContext react to a 401 (expired/invalid token) without a circular import. */
export function setAuthExpiredHandler(listener: AuthExpiredListener | null): void {
  onAuthExpired = listener
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiFailure>) => {
    const status = error.response?.status
    const payload = error.response?.data

    if (status === 401 && getStoredToken()) {
      clearStoredToken()
      onAuthExpired?.()
    }

    const message =
      payload?.message ||
      (error.code === 'ERR_NETWORK'
        ? 'Could not reach the server. Please check your connection and try again.'
        : 'Something went wrong. Please try again.')

    return Promise.reject(new ApiClientError(message, status, payload?.details))
  },
)
