import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  className?: string
  children: ReactNode
}

/** Label + control + inline error, used around every react-hook-form input in the admin panel. */
export default function FormField({ label, htmlFor, error, className = '', children }: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-xs uppercase tracking-wider text-brand-muted">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export const inputClassName =
  'bg-white border border-brand-line px-3.5 py-2.5 text-sm text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-accent transition-colors w-full'
