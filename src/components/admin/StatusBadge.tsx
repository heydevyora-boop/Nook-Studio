interface StatusBadgeProps {
  label: string
  tone?: 'neutral' | 'positive' | 'warning' | 'accent'
}

const TONE_CLASSES: Record<NonNullable<StatusBadgeProps['tone']>, string> = {
  neutral: 'bg-brand-sand/60 text-brand-dark/70',
  positive: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  accent: 'bg-brand-accent/15 text-brand-accent',
}

/** Small pill used across admin tables for status/featured/etc. */
export default function StatusBadge({ label, tone = 'neutral' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-[11px] uppercase tracking-wider font-medium ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  )
}
