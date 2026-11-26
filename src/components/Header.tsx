import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import Logo from './ui/Logo'
import MobileMenu from './MobileMenu'
import { navLinks } from '../data/navigation'
import { useActiveSection } from '../hooks/useActiveSection'

const sectionIds = navLinks.map((link) => link.href.replace('#', ''))

/** Sticky site header with desktop nav, scroll-spy highlighting and a mobile drawer. */
export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const activeId = useActiveSection(sectionIds)

  // Prevent background scroll while the mobile overlay is open.
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  return (
    <header
      className="sticky top-0 z-50 bg-brand-cream/95 backdrop-blur-md border-b border-brand-line/60"
      data-purpose="site-header"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-24 flex items-center justify-between">
        <a href="#home" className="flex items-center gap-2 group" aria-label="NOOKK STUDIO — Home">
          <Logo className="h-20 w-auto text-brand-dark transition-transform group-hover:scale-105 duration-300" />
        </a>

        <nav
          className="hidden lg:flex items-center gap-10 tracking-widest text-xs font-medium uppercase text-brand-dark/80"
          aria-label="Primary"
        >
          {navLinks.map((link) => {
            const id = link.href.replace('#', '')
            const isActive = activeId === id
            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-1 transition-colors after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:bg-brand-accent after:transition-all ${
                  isActive
                    ? 'text-brand-dark after:w-full'
                    : 'text-brand-dark/80 hover:text-brand-accent after:w-0 hover:after:w-full'
                }`}
              >
                {link.label}
              </a>
            )
          })}
        </nav>

        <div className="hidden sm:block">
          <a
            href="#contact"
            className="btn-transition inline-flex items-center gap-2 text-brand-dark hover:text-brand-accent px-2 py-3.5 text-xs font-bold tracking-wider uppercase transition-colors duration-300"
          >
            <span>Book a Consultation</span>
            <span className="text-sm font-light">&rarr;</span>
          </a>
        </div>

        <button
          type="button"
          aria-label="Open navigation menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen(true)}
          className="lg:hidden p-2 text-brand-dark hover:text-brand-accent focus:outline-none"
        >
          <Menu className="w-6 h-6" strokeWidth={1.5} />
        </button>
      </div>

      <MobileMenu isOpen={isMenuOpen} activeId={activeId} onClose={() => setIsMenuOpen(false)} />
    </header>
  )
}
