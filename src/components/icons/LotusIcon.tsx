interface LotusIconProps {
  className?: string
  strokeWidth?: number | string
}

/**
 * Lotus artwork supplied for the "Design Consultation" service tile — the
 * lotus is a traditional sign of clarity and prosperity. `strokeWidth` is
 * accepted (and ignored) so this drops in anywhere a lucide-react icon is
 * expected. Scaled up and forced to pure black so it reads with the same
 * weight as the other (stroke-based) service icons.
 */
export default function LotusIcon({ className }: LotusIconProps) {
  return (
    <img
      src="/icons/lotus.png"
      alt=""
      aria-hidden="true"
      className={`${className ?? ''} scale-125 brightness-0`}
    />
  )
}
