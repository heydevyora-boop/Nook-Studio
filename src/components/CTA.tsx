import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { inquirySchema, type InquiryFormValues } from '../lib/schemas'
import { submitInquiry } from '../services/inquiries'
import { ApiClientError } from '../lib/api'

const BUDGET_OPTIONS = ['Under ₹5 Lakh', '₹5 Lakh – ₹10 Lakh', '₹10 Lakh – ₹25 Lakh', '₹25 Lakh+', 'Prefer not to say']

/** Dark consultation banner followed by a contact form, connected to POST /api/inquiries. */
export default function CTA() {
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      projectType: 'Interior Design',
      budget: '',
      areaSqFt: '',
      message: '',
    },
  })

  const onSubmit = async (values: InquiryFormValues) => {
    try {
      const { message } = await submitInquiry({ ...values, areaSqFt: values.areaSqFt || undefined })
      toast.success(message ?? 'Your inquiry has been received.')
      setIsSubmitted(true)
      reset()
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.details) {
          Object.entries(error.details).forEach(([field, messages]) => {
            if (field in inquirySchema.shape) {
              setError(field as keyof InquiryFormValues, { message: messages[0] })
            }
          })
        }
        toast.error(error.message)
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <section id="contact" className="section-anchor" data-purpose="consultation-section">
      <div className="relative bg-brand-dark text-brand-cream py-24 md:py-32 overflow-hidden text-center">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none mix-blend-soft-light bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1616486029423-aaa4790cf36d?q=80&w=1400&auto=format&fit=crop')",
          }}
          aria-hidden="true"
        />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative max-w-4xl mx-auto px-6 z-10 flex flex-col items-center"
        >
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif-editorial font-light tracking-wide mb-8 leading-tight">
            Let&rsquo;s design your space together.
          </h2>
          <a
            href="#consultation-form"
            className="btn-transition inline-flex items-center gap-3 border border-brand-cream/60 hover:border-brand-cream hover:bg-brand-cream hover:text-brand-dark text-brand-cream px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase transition-all duration-300"
          >
            <span>Book a Free Consultation</span>
            <span className="text-sm">&rarr;</span>
          </a>
        </motion.div>
      </div>

      <div className="bg-brand-card/50 py-20 md:py-28" id="consultation-form">
        <div className="max-w-2xl mx-auto px-6 md:px-12">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.25em] text-brand-muted font-medium mb-4">
              GET IN TOUCH
            </p>
            <h3 className="text-3xl sm:text-4xl font-serif-editorial text-brand-dark">
              Tell us about your project
            </h3>
          </div>

          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-brand-dark/80 bg-brand-cream border border-brand-line px-6 py-8"
              role="status"
            >
              <p className="mb-4">
                Thank you &mdash; your message has been received. Our studio will be in touch within
                two business days.
              </p>
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="text-xs uppercase tracking-widest text-brand-accent hover:text-brand-dark transition-colors"
              >
                Send another message
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-5" noValidate>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-xs uppercase tracking-wider text-brand-muted">
                  Full Name
                </label>
                <input
                  id="name"
                  autoComplete="name"
                  className="bg-brand-cream border border-brand-line px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder="Jane Doe"
                  {...register('name')}
                />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs uppercase tracking-wider text-brand-muted">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="bg-brand-cream border border-brand-line px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder="jane@email.com"
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-xs uppercase tracking-wider text-brand-muted">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  className="bg-brand-cream border border-brand-line px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder="+91 000 000 0000"
                  {...register('phone')}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="projectType" className="text-xs uppercase tracking-wider text-brand-muted">
                  Project Type
                </label>
                <select
                  id="projectType"
                  className="bg-brand-cream border border-brand-line px-4 py-3 text-sm text-brand-dark focus:outline-none focus:border-brand-accent transition-colors"
                  {...register('projectType')}
                >
                  <option>Interior Design</option>
                  <option>Product Designing</option>
                  <option>Space Planning</option>
                  <option>Design Consultation</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="areaSqFt" className="text-xs uppercase tracking-wider text-brand-muted">
                  Area (sq. ft.)
                </label>
                <input
                  id="areaSqFt"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  className="bg-brand-cream border border-brand-line px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder="e.g. 1200"
                  {...register('areaSqFt')}
                />
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label htmlFor="budget" className="text-xs uppercase tracking-wider text-brand-muted">
                  Investment
                </label>
                <select
                  id="budget"
                  className="bg-brand-cream border border-brand-line px-4 py-3 text-sm text-brand-dark focus:outline-none focus:border-brand-accent transition-colors"
                  defaultValue=""
                  {...register('budget')}
                >
                  <option value="" disabled>
                    Select a range
                  </option>
                  {BUDGET_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label htmlFor="message" className="text-xs uppercase tracking-wider text-brand-muted">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="bg-brand-cream border border-brand-line px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-accent transition-colors resize-none"
                  placeholder="Tell us about your space, timeline and goals."
                  {...register('message')}
                />
                {errors.message && <p className="text-xs text-red-600">{errors.message.message}</p>}
              </div>

              <div className="sm:col-span-2 flex justify-center mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-transition inline-flex items-center gap-3 bg-brand-dark text-brand-cream hover:bg-[#3d251c] px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase transition-colors duration-300 disabled:opacity-60"
                >
                  <span>{isSubmitting ? 'Sending…' : 'Send Message'}</span>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
