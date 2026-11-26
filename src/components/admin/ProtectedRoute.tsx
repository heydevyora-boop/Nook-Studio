import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Logo from '../ui/Logo'

/**
 * Gates every /admin/* route behind a valid session AND the ADMIN role.
 * - Not signed in at all → sent to the login page (and back here after).
 * - Signed in as staff/user → sent to the public home page. They're a
 *   legitimate, authenticated account; they just aren't an administrator,
 *   so the admin panel simply isn't part of their app.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <Logo className="h-10 w-auto text-brand-dark animate-pulse" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
