import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { clearStoredToken, getStoredToken, setAuthExpiredHandler, setStoredToken } from '../lib/api'
import { fetchCurrentUser, login as loginRequest } from '../services/auth'
import type { AdminUser, Role } from '../types/api'
import type { LoginFormValues } from '../lib/schemas'

interface AuthContextValue {
  user: AdminUser | null
  /** The logged-in user's role, or null when signed out. Mirrors `user.role`. */
  role: Role | null
  /** The current JWT, or null when signed out. Also persisted in localStorage. */
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  /** True only while the stored token is being validated on first load. */
  isLoading: boolean
  /** Resolves with the logged-in user so callers can branch on `role` immediately. */
  login: (values: LoginFormValues) => Promise<AdminUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    clearStoredToken()
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setAuthExpiredHandler(logout)
    return () => setAuthExpiredHandler(null)
  }, [logout])

  useEffect(() => {
    // Runs once, to validate a token already in storage from a previous
    // session. A token set by `login()` already carries its user with it,
    // so this intentionally does not re-run when `token` changes later.
    if (!getStoredToken()) {
      setIsLoading(false)
      return
    }

    fetchCurrentUser()
      .then(setUser)
      .catch(() => {
        clearStoredToken()
        setToken(null)
      })
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (values: LoginFormValues) => {
    const { user: loggedInUser, token: newToken } = await loginRequest(values)
    setStoredToken(newToken)
    setToken(newToken)
    setUser(loggedInUser)
    return loggedInUser
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      token,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
