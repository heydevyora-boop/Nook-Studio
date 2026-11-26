const WORDS = ['Minimal', 'Functional', 'Refined', 'Timeless', 'Intentional']

/**
 * Thin editorial divider placed directly beneath the hero image — a quiet
 * restatement of the studio's design principles, matching the reference layout.
 */
export default function MinimalEleganceBar() {
  return (
    <div className="py-8 md:py-10" data-purpose="minimal-elegance-bar">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 md:gap-x-6">
          {WORDS.map((word, index) => (
            <div key={word} className="flex items-center gap-4 md:gap-6">
              {index > 0 && <span className="h-px w-6 md:w-10 bg-brand-dark/30" aria-hidden="true" />}
              <span className="text-[11px] md:text-xs uppercase tracking-[0.3em] text-brand-dark/70 font-medium">
                {word}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
