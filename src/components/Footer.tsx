import { Mail, Phone } from 'lucide-react'
import { socialLinks } from '../data/navigation'

const STUDIO_EMAIL = 'Studionookk@gmail.com'
const STUDIO_PHONE_DISPLAY = '+91 63575 31569'
const STUDIO_PHONE_HREF = '+916357531569'

/** Site footer with contact details, copyright and social/legal links. */
export default function Footer() {
  return (
    <footer
      className="bg-[#1d120d] text-brand-sand border-t border-white/10 py-10"
      data-purpose="site-footer"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10 text-sm font-light tracking-wide">
          <a
            href={`mailto:${STUDIO_EMAIL}`}
            className="inline-flex items-center gap-2 text-brand-sand/90 hover:text-brand-cream transition-colors"
          >
            <Mail className="h-4 w-4" strokeWidth={1.5} />
            {STUDIO_EMAIL}
          </a>
          <a
            href={`tel:${STUDIO_PHONE_HREF}`}
            className="inline-flex items-center gap-2 text-brand-sand/90 hover:text-brand-cream transition-colors"
          >
            <Phone className="h-4 w-4" strokeWidth={1.5} />
            {STUDIO_PHONE_DISPLAY}
          </a>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-light tracking-wider">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-brand-cream tracking-normal font-serif-editorial text-lg">
              NOOKK STUDIO
            </span>
            <span className="text-brand-muted">&copy; {new Date().getFullYear()}. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-8 text-brand-sand/80">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-cream transition-colors"
              >
                {social.label}
              </a>
            ))}
            <a href="#" className="hover:text-brand-cream transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
