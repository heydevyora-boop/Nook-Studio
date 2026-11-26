import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Image,
  Inbox,
  Newspaper,
  Sparkles,
  Quote,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Logo from '../ui/Logo'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/projects', label: 'Projects', icon: Image, end: false },
  { to: '/admin/inquiries', label: 'Inquiries', icon: Inbox, end: false },
  { to: '/admin/journal', label: 'Journal', icon: Newspaper, end: false },
  { to: '/admin/services', label: 'Services', icon: Sparkles, end: false },
  { to: '/admin/testimonials', label: 'Testimonials', icon: Quote, end: false },
] as const

function SidebarContent({
  onNavigate,
  onClose,
}: {
  onNavigate?: () => void
  onClose?: () => void
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="flex h-full flex-col bg-brand-dark text-brand-cream">
      <div className="px-6 py-8 flex items-center justify-between">
        <Logo className="h-9 w-auto text-brand-cream" mutedColor="#D9CFC4" />
        {onClose && (
          <button
            type="button"
            aria-label="Close admin menu"
            onClick={onClose}
            className="p-1 text-brand-sand/70 hover:text-brand-cream"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-1" aria-label="Admin">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm tracking-wide transition-colors ${
                isActive
                  ? 'bg-brand-cream/10 text-brand-cream'
                  : 'text-brand-sand/70 hover:bg-brand-cream/5 hover:text-brand-cream'
              }`
            }
          >
            <Icon className="h-4 w-4" strokeWidth={1.5} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-brand-cream/10 px-6 py-5">
        <p className="text-xs uppercase tracking-wider text-brand-sand/50 mb-1">Signed in as</p>
        <p className="text-sm text-brand-cream truncate mb-4">{user?.name ?? user?.email}</p>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-brand-sand/70 hover:text-brand-cream transition-colors mb-3"
        >
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
          View live site
        </a>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs uppercase tracking-wider text-brand-sand/70 hover:text-brand-cream transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
          Log out
        </button>
      </div>
    </div>
  )
}

/** Shell for every /admin/* page: fixed sidebar on desktop, slide-in drawer on mobile. */
export default function AdminLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30">
        <SidebarContent />
      </aside>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">
            <SidebarContent
              onNavigate={() => setIsDrawerOpen(false)}
              onClose={() => setIsDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between bg-brand-cream/95 backdrop-blur-sm border-b border-brand-line px-4 h-16">
          <Logo className="h-8 w-auto text-brand-dark" />
          <button
            type="button"
            aria-label="Open admin menu"
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 text-brand-dark"
          >
            <Menu className="h-6 w-6" strokeWidth={1.5} />
          </button>
        </header>

        <main className="px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
