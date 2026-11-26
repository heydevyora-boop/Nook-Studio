import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Image, Inbox, Newspaper, Quote, Sparkles } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { adminListProjects } from '../../services/projects'
import { adminListInquiries } from '../../services/inquiries'
import { adminListJournal } from '../../services/journal'
import { adminListServices } from '../../services/services'
import { adminListTestimonials } from '../../services/testimonials'
import StatCard from '../../components/admin/StatCard'
import StatusBadge from '../../components/admin/StatusBadge'
import { useAuth } from '../../context/AuthContext'

async function loadDashboardData() {
  const [projectsAll, projectsPublished, projectsDraft, inquiriesRecent, inquiriesNew, journalAll, services, testimonials] =
    await Promise.all([
      adminListProjects({ limit: 1 }),
      adminListProjects({ status: 'PUBLISHED', limit: 1 }),
      adminListProjects({ status: 'DRAFT', limit: 1 }),
      adminListInquiries({ limit: 5 }),
      adminListInquiries({ status: 'NEW', limit: 1 }),
      adminListJournal({ limit: 1 }),
      adminListServices(),
      adminListTestimonials(),
    ])

  return {
    projectsTotal: projectsAll.meta.total,
    projectsPublished: projectsPublished.meta.total,
    projectsDraft: projectsDraft.meta.total,
    inquiriesTotal: inquiriesRecent.meta.total,
    inquiriesNew: inquiriesNew.meta.total,
    recentInquiries: inquiriesRecent.items,
    journalTotal: journalAll.meta.total,
    servicesTotal: services.length,
    testimonialsTotal: testimonials.length,
  }
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const { data, loading, error, refetch } = useAsync(useCallback(loadDashboardData, []))

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-brand-muted mb-2">Dashboard</p>
      <h1 className="font-serif-editorial text-3xl md:text-4xl text-brand-dark mb-8">
        Welcome back{user?.name ? `, ${user.name}` : ''}
      </h1>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 bg-brand-sand/40 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-12">
          <p className="text-sm text-brand-dark/70 mb-3">{error}</p>
          <button onClick={refetch} className="text-xs uppercase tracking-widest text-brand-accent">
            Try again
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
            <StatCard
              label="Projects"
              value={data.projectsTotal}
              icon={Image}
              to="/admin/projects"
              hint={`${data.projectsPublished} published · ${data.projectsDraft} draft`}
            />
            <StatCard
              label="Inquiries"
              value={data.inquiriesTotal}
              icon={Inbox}
              to="/admin/inquiries"
              hint={`${data.inquiriesNew} new`}
            />
            <StatCard label="Journal Posts" value={data.journalTotal} icon={Newspaper} to="/admin/journal" />
            <StatCard label="Services" value={data.servicesTotal} icon={Sparkles} to="/admin/services" />
            <StatCard label="Testimonials" value={data.testimonialsTotal} icon={Quote} to="/admin/testimonials" />
          </div>

          <div className="bg-white border border-brand-line">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-line">
              <h2 className="font-serif-editorial text-xl text-brand-dark">Recent Inquiries</h2>
              <Link
                to="/admin/inquiries"
                className="text-xs uppercase tracking-wider text-brand-accent hover:text-brand-dark transition-colors"
              >
                View all
              </Link>
            </div>

            {data.recentInquiries.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-brand-dark/60">No inquiries yet.</p>
            ) : (
              <ul className="divide-y divide-brand-line">
                {data.recentInquiries.map((inquiry) => (
                  <li key={inquiry.id} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-dark truncate">{inquiry.name}</p>
                      <p className="text-xs text-brand-muted truncate">{inquiry.email}</p>
                    </div>
                    <StatusBadge
                      label={inquiry.status}
                      tone={inquiry.status === 'NEW' ? 'accent' : inquiry.status === 'CLOSED' ? 'neutral' : 'positive'}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
