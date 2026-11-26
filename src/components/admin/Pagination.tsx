import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PaginationMeta } from '../../types/api'

interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}

/** Prev/next pager driven by the backend's { page, limit, total, totalPages } meta. */
export default function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-4 text-sm text-brand-dark/70">
      <p>
        Page {meta.page} of {meta.totalPages} &middot; {meta.total} total
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(meta.page - 1)}
          disabled={meta.page <= 1}
          aria-label="Previous page"
          className="p-2 border border-brand-line disabled:opacity-40 hover:border-brand-dark transition-colors"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(meta.page + 1)}
          disabled={meta.page >= meta.totalPages}
          aria-label="Next page"
          className="p-2 border border-brand-line disabled:opacity-40 hover:border-brand-dark transition-colors"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
