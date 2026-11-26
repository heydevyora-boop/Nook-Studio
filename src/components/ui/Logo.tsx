interface LogoProps {
  className?: string
  mutedColor?: string
}

/** NOOKK STUDIO company logo, used in the header, footer and admin panel. */
export default function Logo({ className = 'h-10 w-auto' }: LogoProps) {
  return <img src="/logo-mark.png" alt="NOOKK STUDIO" className={className} />
}
