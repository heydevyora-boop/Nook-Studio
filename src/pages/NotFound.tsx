import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-6 text-center">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-brand-muted mb-4">404</p>
        <h1 className="font-serif-editorial text-5xl sm:text-6xl text-brand-dark mb-6">
          Page not <span className="italic font-light">found</span>
        </h1>
        <p className="text-sm text-brand-dark/70 mb-8 max-w-md mx-auto">
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-3 border border-brand-dark/40 hover:border-brand-dark bg-transparent hover:bg-brand-sand/40 text-brand-dark px-7 py-3.5 text-xs uppercase tracking-widest font-medium transition-colors duration-300"
        >
          <span>Back to Home</span>
          <span className="text-base leading-none">&rarr;</span>
        </Link>
      </div>
    </div>
  )
}
