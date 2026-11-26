import { AnimatePresence, motion } from 'framer-motion'
import { TriangleAlert } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Blocking confirmation dialog for destructive actions (delete, etc). */
export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Delete',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            className="fixed inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-sm bg-brand-cream border border-brand-line shadow-2xl p-6"
          >
            <div className="flex items-start gap-3 mb-5">
              <TriangleAlert className="h-5 w-5 text-brand-accent shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <h2 className="font-serif-editorial text-xl text-brand-dark mb-1">{title}</h2>
                <p className="text-sm text-brand-dark/70">{description}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 text-xs uppercase tracking-wider border border-brand-dark/30 hover:border-brand-dark transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="px-4 py-2 text-xs uppercase tracking-wider bg-brand-dark text-brand-cream hover:bg-[#3d251c] transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Deleting…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
