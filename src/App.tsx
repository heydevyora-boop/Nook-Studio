import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'sonner'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Logo from './components/ui/Logo'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/admin/ProtectedRoute'
import AdminLayout from './components/admin/AdminLayout'
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import ProjectsPage from './pages/admin/ProjectsPage'
import InquiriesPage from './pages/admin/InquiriesPage'
import JournalPage from './pages/admin/JournalPage'
import ServicesPage from './pages/admin/ServicesPage'
import TestimonialsPage from './pages/admin/TestimonialsPage'

function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-cream"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Logo className="h-12 w-auto text-brand-dark" />
      </motion.div>
    </motion.div>
  )
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simple production-safe loading gate: resolves once the window has
    // fully loaded (images included), with a short floor so the splash
    // doesn't just flash on fast connections.
    const minimumDelay = new Promise((resolve) => setTimeout(resolve, 500))
    const windowLoaded =
      document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise<void>((resolve) => window.addEventListener('load', () => resolve(), { once: true }))

    Promise.all([minimumDelay, windowLoaded]).then(() => setIsLoading(false))
  }, [])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AnimatePresence>{isLoading && <LoadingScreen />}</AnimatePresence>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#F7F3ED',
                color: '#261711',
                border: '1px solid #D9CFC4',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              },
            }}
          />
          <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="inquiries" element={<InquiriesPage />} />
              <Route path="journal" element={<JournalPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="testimonials" element={<TestimonialsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
