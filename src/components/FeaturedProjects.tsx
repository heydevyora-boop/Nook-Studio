import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, BedDouble, Sofa, BookOpen, type LucideIcon } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { listPublishedProjects } from '../services/projects'
import { CATEGORY_LABELS } from '../lib/projectCategory'
import ImageWithSkeleton from './ui/ImageWithSkeleton'
import { SectionSkeleton } from './ui/SectionStates'

interface DisplayProject {
  id: string
  title: string
  subtitle: string
  images: string[]
  icon: LucideIcon
}

// Mirrors the studio's seeded flagship projects (server/prisma/seed.ts) so
// visitors always see a populated gallery even if the API is briefly
// unreachable. `icon` is only ever shown if every image in `images` 404s.
const FALLBACK_PROJECTS: DisplayProject[] = [
  {
    id: 'fallback-the-harmony-project',
    title: 'The Harmony Project',
    subtitle:
      'The clients envisioned space that feels warm, elegant and comfortable, with a perfect balance of classic detailing and modern functionality.',
    images: [
      '/projects/the-harmony-project/03-bedroom.jpg',
      '/projects/the-harmony-project/01-entryway-wardrobe.jpg',
      '/projects/the-harmony-project/02-tv-media-wall.jpg',
      '/projects/the-harmony-project/04-living-room-sofa.jpg',
    ],
    icon: Sofa,
  },
  {
    id: 'fallback-aura-residence',
    title: 'A Pause From The Ordinary.',
    subtitle:
      'A quiet corner where sunlight filters through the leaves, gentle pathways lead the way, and nature creates its own rhythm. An intimate escape designed for moments of peace.',
    images: ['/projects/aura-residence/garden-path.jpg'],
    icon: Building2,
  },
  {
    id: 'fallback-solitude-suite',
    title: 'Warmth, Crafted into Design',
    subtitle:
      'A balance of rich wooden accents, subtle textures and ambient lighting. Every element comes together to create a space that feels inviting, refined and effortlessly elegant.',
    images: ['/projects/solitude-suite/heritage-living.jpg'],
    icon: BedDouble,
  },
  {
    id: 'fallback-the-art-of-slowing-down',
    title: 'The Art of Slowing Down',
    subtitle:
      'A warm blend of natural textures and ambient lighting, designed for moments that belong only to you.',
    images: ['/projects/the-art-of-slowing-down/library-room.jpg'],
    icon: BookOpen,
  },
]

function projectSubtitle(project: { shortDescription: string | null; category: string; location: string | null }) {
  if (project.shortDescription) return project.shortDescription
  const categoryLabel = CATEGORY_LABELS[project.category as keyof typeof CATEGORY_LABELS] ?? project.category
  return project.location ? `${categoryLabel} — ${project.location}` : categoryLabel
}

/**
 * Project media: cycles through every image in the project's gallery (one
 * dot per image, auto-advancing every 3.5s when there's more than one), and
 * quietly falls back to a line icon only if every image in the set 404s.
 */
function ProjectCardMedia({ images, icon: Icon, alt }: { images: string[]; icon: LucideIcon; alt: string }) {
  const [index, setIndex] = useState(0)
  const [failedSet, setFailedSet] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % images.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [images.length])

  if (failedSet.size >= images.length) {
    return (
      <div className="flex items-center justify-center bg-brand-sand/50 aspect-[4/3] md:aspect-[3/4] lg:aspect-[4/3] mb-4 group-hover:bg-brand-sand/70 transition-colors">
        <Icon className="w-12 h-12 text-brand-dark/40" strokeWidth={1} />
      </div>
    )
  }

  return (
    <div className="relative bg-brand-sand/50 aspect-[4/3] md:aspect-[3/4] lg:aspect-[4/3] mb-4 overflow-hidden">
      <ImageWithSkeleton
        key={index}
        src={images[index]}
        alt={`${alt} — photo ${index + 1} of ${images.length}`}
        wrapperClassName="w-full h-full"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        onError={() => {
          setFailedSet((prev) => new Set(prev).add(index))
          setIndex((current) => (current + 1) % images.length)
        }}
      />
      {images.length > 1 && (
        <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-1.5">
          {images.map((_, dotIndex) => (
            <button
              key={dotIndex}
              type="button"
              aria-label={`Show photo ${dotIndex + 1}`}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setIndex(dotIndex)
              }}
              className={`h-1.5 rounded-full transition-all ${
                dotIndex === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/** Showcase grid of flagship projects with a hover scale reveal. */
export default function FeaturedProjects() {
  const fetchFeatured = useCallback(
    () => listPublishedProjects({ featured: true, limit: 4 }).then((result) => result.items),
    [],
  )
  const { data, loading, error } = useAsync(fetchFeatured)

  const projects: DisplayProject[] =
    !loading && (error || !data || data.length === 0)
      ? FALLBACK_PROJECTS
      : (data ?? []).map((project, index) => ({
          id: project.id,
          title: project.title,
          subtitle: projectSubtitle(project),
          images: project.images && project.images.length > 0 ? project.images : [project.coverImage],
          icon: FALLBACK_PROJECTS[index % FALLBACK_PROJECTS.length].icon,
        }))

  return (
    <section id="projects" className="section-anchor py-20 md:py-28" data-purpose="featured-projects">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-10 border-b border-brand-line/60 mb-12 gap-4">
          <div className="flex items-center gap-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif-editorial text-brand-dark font-normal tracking-tight">
              Featured Projects
            </h2>
            <div className="hidden sm:block w-12 h-[1.5px] bg-brand-accent" />
          </div>
          <a
            href="#projects"
            className="btn-transition inline-flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-brand-dark/90 hover:text-brand-accent group"
          >
            <span>View All Projects</span>
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </a>
        </div>

        {loading && <SectionSkeleton columns={4} />}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {projects.map((project, index) => (
              <motion.article
                key={project.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, delay: index * 0.12, ease: 'easeOut' }}
                className="group cursor-pointer flex flex-col"
                data-purpose="project-card"
              >
                <ProjectCardMedia images={project.images} icon={project.icon} alt={project.title} />
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <h3 className="font-serif-editorial text-xl md:text-2xl text-brand-dark group-hover:text-brand-accent transition-colors font-medium">
                      {project.title}
                    </h3>
                    <p className="text-sm text-brand-dark/70 leading-relaxed font-light mt-1.5">{project.subtitle}</p>
                  </div>
                  <span className="text-sm font-light text-brand-dark opacity-0 group-hover:opacity-100 transition-opacity">
                    &#8599;
                  </span>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
