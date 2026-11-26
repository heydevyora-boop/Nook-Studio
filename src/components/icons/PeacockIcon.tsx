interface PeacockIconProps {
  className?: string
  strokeWidth?: number | string
}

/**
 * Peacock artwork supplied for the "Product Designing" service tile.
 * `strokeWidth` is accepted (and ignored) so this drops in anywhere a
 * lucide-react icon is expected. Scaled up and forced to pure black so it
 * reads with the same weight as the other (stroke-based) service icons.
 */
export default function PeacockIcon({ className }: PeacockIconProps) {
  return (
    <img
      src="/icons/peacock.png"
      alt=""
      aria-hidden="true"
      className={`${className ?? ''} scale-125 brightness-0`}
    />
  )
}
