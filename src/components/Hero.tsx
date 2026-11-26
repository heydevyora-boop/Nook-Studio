import { motion } from 'framer-motion'
import ImageWithSkeleton from './ui/ImageWithSkeleton'

/** Editorial hero: left-aligned statement copy, right-aligned arched hero image. */
export default function Hero() {
  return (
    <section
      id="home"
      className="section-anchor relative pt-6 md:pt-10 pb-16 md:pb-24 overflow-hidden"
      data-purpose="hero-section"
    >
      <div className="px-6 md:px-12 lg:px-0">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-0 min-h-[620px] lg:min-h-[540px]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="lg:basis-5/12 lg:shrink-0 flex flex-col justify-center z-10 lg:pl-[max(3rem,calc((100vw_-_80rem)/2_+_3rem))] lg:pr-6 xl:pr-10"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-brand-muted font-medium mb-4">
              NOOKK STUDIO
            </p>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif-editorial leading-[1.12] text-brand-dark font-normal mb-6 uppercase tracking-normal">
              Thoughtfully
              <br />
              designed spaces
            </h1>
            <div className="w-14 h-[2px] bg-brand-accent mb-6" />
            <p className="text-xs sm:text-sm tracking-wide text-brand-dark/85 font-normal mb-8 leading-relaxed">
              Interior Design &nbsp;|&nbsp; Product Design &nbsp;|&nbsp; Space Planning
            </p>
            <div>
              <a
                href="#projects"
                className="btn-transition inline-flex items-center gap-3 border border-brand-dark/40 hover:border-brand-dark bg-transparent hover:bg-brand-sand/40 text-brand-dark px-7 py-3.5 text-xs uppercase tracking-widest font-medium transition-colors duration-300"
              >
                <span>Explore Projects</span>
                <span className="text-base leading-none">&rarr;</span>
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
            className="relative w-full lg:flex-1 flex justify-end"
          >
            <ImageWithSkeleton
              src="/hero-living-room.jpg"
              alt="NOOKK Studio curated living interior featuring a cream curved sofa, round travertine table and floral arrangement"
              wrapperClassName="w-full aspect-[4/3] md:aspect-[16/11] lg:aspect-auto lg:h-[540px] arch-mask shadow-2xl bg-brand-card"
              className="w-full h-full object-cover object-bottom hover:scale-[1.02] transition-transform duration-700 ease-out"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
