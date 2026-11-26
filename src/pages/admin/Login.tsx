import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useLocation, useNavigate, type Location } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { loginSchema, type LoginFormValues } from '../../lib/schemas'
import { ApiClientError } from '../../lib/api'
import { inputClassName } from '../../components/admin/FormField'
import Logo from '../../components/ui/Logo'

export default function AdminLogin() {
  const { login, isAuthenticated, isAdmin, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  if (!isAuthLoading && isAuthenticated) {
    // Admins return to wherever they were headed (the admin panel by
    // default); staff/user accounts have no admin destination, so they
    // always land on the public site.
    const adminRedirect = (location.state as { from?: Location } | null)?.from ?? '/admin'
    return <Navigate to={isAdmin ? adminRedirect : '/'} replace />
  }

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true)
    try {
      const user = await login(values)
      toast.success('Welcome back')
      if (user.role === 'ADMIN') {
        const redirectTo = (location.state as { from?: Location } | null)?.from ?? '/admin'
        navigate(redirectTo, { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : 'Unable to sign in'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <Logo className="h-11 w-auto text-brand-dark" />
        </div>

        <div className="bg-white border border-brand-line p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-brand-muted mb-2 text-center">
            Sign in
          </p>
          <h1 className="font-serif-editorial text-3xl text-brand-dark mb-8 text-center">
            Welcome back
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-xs uppercase tracking-wider text-brand-muted">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                className={inputClassName}
                placeholder="admin"
                {...register('username')}
              />
              {errors.username && <p className="text-xs text-red-600">{errors.username.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs uppercase tracking-wider text-brand-muted">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className={inputClassName}
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex items-center justify-center gap-2 bg-brand-dark text-brand-cream hover:bg-[#3d251c] px-6 py-3.5 text-xs font-medium tracking-wider uppercase transition-colors disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
