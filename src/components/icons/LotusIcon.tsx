interface LotusIconProps {
  className?: string
  strokeWidth?: number | string
}

/**
 * Lotus artwork supplied for the "Design Consultation" service tile — the
 * lotus is a traditional sign of clarity and prosperity. `strokeWidth` is
 * accepted (and ignored) so this drops in anywhere a lucide-react icon is
 * expected. Rendered as a CSS mask filled with `currentColor` (instead of
 * an <img>) so it picks up the same `group-hover:text-brand-accent` hover
 * color the stroke-based icons get.
 */
export default function LotusIcon({ className }: LotusIconProps) {
  return (
    <span
      role="img"
      aria-hidden="true"
      className={`${className ?? ''} scale-125 inline-block bg-current transition-colors`}
      style={{
        maskImage: "url('/icons/lotus.png')",
        WebkitMaskImage: "url('/icons/lotus.png')",
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
      }}
    />
  )
}
