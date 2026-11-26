import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Home, Lamp, type LucideIcon } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { listPublishedJournal } from '../services/journal'
import ImageWithSkeleton from './ui/ImageWithSkeleton'
import { SectionSkeleton } from './ui/SectionStates'

interface DisplayEntry {
  id: string
  title: string
  date: string
  excerpt?: string
  image: string
  icon: LucideIcon
}

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })

function formatPublishedDate(publishedAt: string | null): string {
  if (!publishedAt) return ''
  return dateFormatter.format(new Date(publishedAt))
}

// Shown if the API is briefly unreachable, so the journal never looks empty
// or broken. `icon` is only ever shown if `image` itself fails to load.
const FALLBACK_ENTRIES: DisplayEntry[] = [
  {
    id: 'fallback-texture',
    title: 'Why We Design for Texture Over Trend',
    date: 'This Season',
    excerpt:
      'Trends fade within a season. Texture — travertine, cane, linen, plaster — is what makes a room feel lived-in a decade later.',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=900&auto=format&fit=crop',
    icon: BookOpen,
  },
  {
    id: 'fallback-light',
    title: 'Treating Light as a Material',
    date: 'This Season',
    excerpt:
      'Before fabric or finish, we design how light moves through a room across the day. Every other decision follows from that.',
    image: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?q=80&w=900&auto=format&fit=crop',
    icon: Lamp,
  },
  {
    id: 'fallback-small-spaces',
    title: 'Making Small Spaces Feel Calm, Not Cramped',
    date: 'This Season',
    excerpt:
      'Space planning is restraint. We edit until every piece earns its place — and the room finally has room to breathe.',
    image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=900&auto=format&fit=crop',
    icon: Home,
  },
]

/** Journal cover photo that quietly falls back to a line icon if the image itself 404s. */
function JournalCardMedia({ image, icon: Icon, alt }: { image: string; icon: LucideIcon; alt: string }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="flex items-center justify-center bg-brand-sand/50 aspect-[4/3] mb-4 group-hover:bg-brand-sand/70 transition-colors">
        <Icon className="w-10 h-10 text-brand-dark/40" strokeWidth={1} />
      </div>
    )
  }

  return (
    <ImageWithSkeleton
      src={image}
      alt={alt}
      wrapperClassName="bg-brand-sand/50 aspect-[4/3] mb-4"
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
      onError={() => setFailed(true)}
    />
  )
}

/** Editorial teaser for the studio's journal — short-form notes on the design process. */
export default function Journal() {
  const fetchEntries = useCallback(
    () => listPublishedJournal({ limit: 3 }).then((result) => result.items),
    [],
  )
  const { data, loading, error } = useAsync(fetchEntries)

  const entries: DisplayEntry[] =
    !loading && (error || !data || data.length === 0)
      ? FALLBACK_ENTRIES
      : (data ?? []).map((entry, index) => ({
          id: entry.id,
          title: entry.title,
          date: formatPublishedDate(entry.publishedAt),
          excerpt: entry.excerpt ?? undefined,
          image: entry.coverImage ?? FALLBACK_ENTRIES[index % FALLBACK_ENTRIES.length].image,
          icon: FALLBACK_ENTRIES[index % FALLBACK_ENTRIES.length].icon,
        }))

  return (
    <section id="journal" className="section-anchor py-20 md:py-28" data-purpose="journal-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-10 border-b border-brand-line/60 mb-12 gap-4">
          <div className="flex items-center gap-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif-editorial text-brand-dark font-normal tracking-tight">
              From the Journal
            </h2>
            <div className="hidden sm:block w-12 h-[1.5px] bg-brand-accent" />
          </div>
        </div>

        {loading && <SectionSkeleton columns={3} />}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {entries.map((entry, index) => (
              <motion.article
                key={entry.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
                className="group flex flex-col"
              >
                <JournalCardMedia image={entry.image} icon={entry.icon} alt={entry.title} />
                {entry.date && (
                  <p className="text-xs uppercase tracking-wider text-brand-muted mb-2">{entry.date}</p>
                )}
                <h3 className="font-serif-editorial text-xl md:text-2xl text-brand-dark group-hover:text-brand-accent transition-colors font-medium mb-2">
                  {entry.title}
                </h3>
                {entry.excerpt && (
                  <p className="text-sm text-brand-dark/70 leading-relaxed font-light">{entry.excerpt}</p>
                )}
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
