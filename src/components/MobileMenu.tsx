import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { navLinks } from '../data/navigation'

interface MobileMenuProps {
  isOpen: boolean
  activeId: string
  onClose: () => void
}

/**
 * Full-screen overlay navigation for small screens, rendered via a portal.
 * The header uses `backdrop-blur`, which (like any `filter`/`backdrop-filter`)
 * creates a new containing block for `position: fixed` descendants — without
 * the portal this overlay would be trapped inside the header's own box
 * instead of covering the viewport.
 */
export default function MobileMenu({ isOpen, activeId, onClose }: MobileMenuProps) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col bg-brand-dark text-brand-cream lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div className="flex items-center justify-end px-6 h-24">
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={onClose}
              className="p-2 text-brand-cream hover:text-brand-accent transition-colors"
            >
              <X className="h-7 w-7" strokeWidth={1.5} />
            </button>
          </div>

          <nav className="flex flex-1 flex-col items-center justify-center gap-8" aria-label="Mobile">
            {navLinks.map((link, index) => {
              const isActive = activeId === link.href.replace('#', '')
              return (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * index, duration: 0.35, ease: 'easeOut' }}
                  className={`font-serif-editorial text-4xl transition-colors ${
                    isActive ? 'text-brand-accent' : 'text-brand-cream hover:text-brand-accent'
                  }`}
                >
                  {link.label}
                </motion.a>
              )
            })}

            <motion.a
              href="#contact"
              onClick={onClose}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * navLinks.length, duration: 0.35, ease: 'easeOut' }}
              className="btn-transition mt-4 inline-flex items-center gap-3 border border-brand-cream/50 px-7 py-3.5 text-xs uppercase tracking-widest font-medium hover:bg-brand-cream hover:text-brand-dark transition-colors"
            >
              <span>Book a Consultation</span>
              <span className="text-sm font-light">&rarr;</span>
            </motion.a>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
