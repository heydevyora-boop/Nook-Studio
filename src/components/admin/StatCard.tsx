import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  to?: string
  hint?: string
}

/** Dashboard summary tile. */
export default function StatCard({ label, value, icon: Icon, to, hint }: StatCardProps) {
  const content = (
    <div className="bg-white border border-brand-line p-6 h-full flex flex-col justify-between hover:border-brand-accent/60 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs uppercase tracking-wider text-brand-muted">{label}</p>
        <Icon className="h-5 w-5 text-brand-accent" strokeWidth={1.5} />
      </div>
      <p className="font-serif-editorial text-4xl text-brand-dark">{value}</p>
      {hint && <p className="text-xs text-brand-muted mt-2">{hint}</p>}
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block h-full">
        {content}
      </Link>
    )
  }

  return content
}
