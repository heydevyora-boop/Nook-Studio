import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Armchair, Layers3, Hammer } from 'lucide-react'
import PeacockIcon from './icons/PeacockIcon'
import LotusIcon from './icons/LotusIcon'
import { useAsync } from '../hooks/useAsync'
import { listActiveServices } from '../services/services'
import { getServiceIcon } from '../lib/iconMap'
import { SectionSkeleton } from './ui/SectionStates'

// Sub-categories shown when hovering the "Interior Designing" tile, styled
// to match the MinimalEleganceBar strip under the hero image.
const INTERIOR_DESIGNING_SUBCATEGORIES = ['Residential', 'Commercial', 'Hospitality']

// Trimmed/case-insensitive so this still matches if the live Services data
// (admin-edited or seeded) differs slightly in casing or spacing from the
// fallback title used offline.
function isInteriorDesigning(title: string) {
  return title.trim().toLowerCase() === 'interior designing'
}

// Mirrors the studio's seeded services (server/prisma/seed.ts) so visitors
// always see all disciplines even if the API is briefly unreachable.
const FALLBACK_SERVICES = [
  { id: 'fallback-interior-designing', title: 'Interior Designing', icon: Armchair },
  { id: 'fallback-renovation-redesigning', title: 'Renovation & Redesigning', icon: Hammer },
  { id: 'fallback-space-planning', title: 'Space Planning', icon: Layers3 },
  { id: 'fallback-product-designing', title: 'Product Designing', icon: PeacockIcon },
  { id: 'fallback-design-consultation', title: 'Design Consultation', icon: LotusIcon },
]

/** Quick overview of the studio's core disciplines. */
export default function ServicesBar() {
  const { data, loading, error } = useAsync(listActiveServices)
  const [isInteriorDesigningHovered, setIsInteriorDesigningHovered] = useState(false)

  const services =
    !loading && (error || !data || data.length === 0)
      ? FALLBACK_SERVICES
      : data?.map((service) => ({ id: service.id, title: service.title, icon: getServiceIcon(service.icon) }))

  return (
    <section
      id="services"
      className="section-anchor border-y border-brand-line bg-brand-card/60 py-9"
      data-purpose="services-overview"
      aria-label="Services overview"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {loading && <SectionSkeleton columns={5} />}
        {!loading && services && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-y-8 lg:gap-0 divide-y md:divide-y-0 lg:divide-x divide-brand-line/80 justify-center">
            {services.map(({ id, title, icon: Icon }, index) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
                className="flex flex-col items-center text-center px-4 pt-4 md:pt-0 group"
                onMouseEnter={() => isInteriorDesigning(title) && setIsInteriorDesigningHovered(true)}
                onMouseLeave={() => isInteriorDesigning(title) && setIsInteriorDesigningHovered(false)}
              >
                <div className="h-10 w-10 mb-3 flex items-center justify-center text-brand-dark group-hover:text-brand-accent transition-colors">
                  <Icon className="w-8 h-8" strokeWidth={1.25} />
                </div>
                <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-brand-dark">{title}</h3>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isInteriorDesigningHovered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pt-7 max-w-7xl mx-auto px-6 md:px-12">
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 md:gap-x-6">
                {INTERIOR_DESIGNING_SUBCATEGORIES.map((word, index) => (
                  <div key={word} className="flex items-center gap-4 md:gap-6">
                    {index > 0 && <span className="h-px w-6 md:w-10 bg-brand-dark/30" aria-hidden="true" />}
                    <span className="text-[11px] md:text-xs uppercase tracking-[0.3em] text-brand-dark/70 font-medium">
                      {word}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
