const GRID_COLUMN_CLASSES: Record<number, string> = {
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
}

/** Pulsing placeholder grid shown while a public section's data is loading. */
export function SectionSkeleton({ columns = 3 }: { columns?: number }) {
  return (
    <div className={`grid grid-cols-1 ${GRID_COLUMN_CLASSES[columns] ?? 'md:grid-cols-3'} gap-8`}>
      {Array.from({ length: columns }).map((_, index) => (
        <div key={index} className="flex flex-col gap-4">
          <div className="aspect-[4/3] bg-brand-sand/60 animate-pulse" />
          <div className="h-4 w-2/3 bg-brand-sand/60 animate-pulse" />
          <div className="h-3 w-1/3 bg-brand-sand/40 animate-pulse" />
        </div>
      ))}
    </div>
  )
}
