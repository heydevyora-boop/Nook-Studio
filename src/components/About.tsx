import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import ImageWithSkeleton from './ui/ImageWithSkeleton'

/** Split layout: architectural imagery paired with the studio's design philosophy. */
export default function About() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section
      id="about"
      className="section-anchor py-16 md:py-24 bg-brand-card/40 border-t border-brand-line/60"
      data-purpose="about-section"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="lg:col-span-6 order-2 lg:order-1"
          >
            <ImageWithSkeleton
              src="https://images.unsplash.com/photo-1600210492493-0946911123ea?q=80&w=1200&auto=format&fit=crop"
              alt="NOOKK Studio curated living interior featuring a cream curved sofa, round travertine table and floral arrangement"
              wrapperClassName="w-full aspect-[4/3] sm:aspect-[16/10] shadow-lg bg-brand-sand"
              className="w-full h-full object-cover object-[20%_80%]"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
            className="lg:col-span-6 order-1 lg:order-2 flex flex-col justify-center lg:pl-6"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-brand-muted font-medium mb-4">
              ABOUT US
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif-editorial text-brand-dark font-normal leading-[1.12] mb-6">
              About Nookk Studio
            </h2>
            <div className="w-14 h-[2px] bg-brand-accent mb-6" />
            <p className="text-sm sm:text-base text-brand-dark/80 leading-relaxed font-light mb-4 max-w-xl">
              Founded by Aayushii Gupta, NOOKK STUDIO is a Bhopal, Madhya Pradesh-based design
              studio driven by creativity, individuality and a passion for meaningful design.
            </p>
            <p className="text-sm sm:text-base text-brand-dark/80 leading-relaxed font-light mb-8 max-w-xl">
              We believe great design goes beyond aesthetics. It is the art of balancing
              functionality, refined details and visual harmony to create spaces that feel
              personal, purposeful and timeless.
            </p>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <p className="text-sm sm:text-base text-brand-dark/80 leading-relaxed font-light mb-4 max-w-xl">
                    We value simplicity without compromising character, elegance without excess
                    and design that enhances the way people live and experience their
                    surroundings.
                  </p>
                  <p className="text-sm sm:text-base text-brand-dark/80 leading-relaxed font-semibold mb-8 max-w-xl">
                    Because the true beauty of design lies not just in what the eyes see, but in
                    what the heart feels.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <button
                type="button"
                onClick={() => setIsExpanded((current) => !current)}
                aria-expanded={isExpanded}
                className="btn-transition inline-flex items-center gap-3 border border-brand-dark/40 hover:border-brand-dark bg-transparent hover:bg-brand-sand/50 text-brand-dark px-7 py-3 text-xs uppercase tracking-widest font-medium transition-colors duration-300"
              >
                <span>{isExpanded ? 'Show Less' : 'Know More'}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                  strokeWidth={1.75}
                />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
