import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useAsync } from '../../hooks/useAsync'
import {
  adminCreateTestimonial,
  adminDeleteTestimonial,
  adminListTestimonials,
  adminUpdateTestimonial,
} from '../../services/testimonials'
import { testimonialSchema, type TestimonialFormInput, type TestimonialFormValues } from '../../lib/schemas'
import { ApiClientError } from '../../lib/api'
import type { ApiTestimonial } from '../../types/api'
import Modal from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/admin/StatusBadge'
import FormField, { inputClassName } from '../../components/admin/FormField'
import ImageUploader from '../../components/admin/ImageUploader'

const emptyValues: TestimonialFormInput = {
  clientName: '',
  projectTitle: '',
  content: '',
  rating: 5,
  image: '',
  isActive: true,
}

function toFormValues(testimonial: ApiTestimonial): TestimonialFormInput {
  return {
    clientName: testimonial.clientName,
    projectTitle: testimonial.projectTitle ?? '',
    content: testimonial.content,
    rating: testimonial.rating,
    image: testimonial.image ?? '',
    isActive: testimonial.isActive,
  }
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-brand-accent">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5" fill={i < rating ? 'currentColor' : 'none'} strokeWidth={1.5} />
      ))}
    </div>
  )
}

export default function TestimonialsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<ApiTestimonial | null>(null)
  const [deletingTestimonial, setDeletingTestimonial] = useState<ApiTestimonial | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: testimonials, loading, error, refetch } = useAsync(adminListTestimonials)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TestimonialFormInput, unknown, TestimonialFormValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: emptyValues,
  })

  const openCreateModal = () => {
    setEditingTestimonial(null)
    reset(emptyValues)
    setIsModalOpen(true)
  }

  const openEditModal = (testimonial: ApiTestimonial) => {
    setEditingTestimonial(testimonial)
    reset(toFormValues(testimonial))
    setIsModalOpen(true)
  }

  const onSubmit = async (values: TestimonialFormValues) => {
    try {
      const { message } = editingTestimonial
        ? await adminUpdateTestimonial(editingTestimonial.id, values)
        : await adminCreateTestimonial(values)
      toast.success(message ?? 'Saved successfully')
      setIsModalOpen(false)
      refetch()
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to save testimonial')
    }
  }

  const toggleActive = async (testimonial: ApiTestimonial) => {
    try {
      await adminUpdateTestimonial(testimonial.id, { isActive: !testimonial.isActive })
      toast.success(testimonial.isActive ? 'Deactivated' : 'Activated')
      refetch()
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to update testimonial')
    }
  }

  const handleDelete = async () => {
    if (!deletingTestimonial) return
    setIsDeleting(true)
    try {
      const { message } = await adminDeleteTestimonial(deletingTestimonial.id)
      toast.success(message ?? 'Testimonial deleted')
      setDeletingTestimonial(null)
      refetch()
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to delete testimonial')
    } finally {
      setIsDeleting(false)
    }
  }

  const image = watch('image')

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-brand-muted mb-2">Content</p>
          <h1 className="font-serif-editorial text-3xl text-brand-dark">Testimonials</h1>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-brand-dark text-brand-cream px-5 py-2.5 text-xs uppercase tracking-wider hover:bg-[#3d251c] transition-colors"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          New Testimonial
        </button>
      </div>

      <div className="bg-white border border-brand-line overflow-x-auto">
        {loading && <div className="p-10 text-center text-sm text-brand-dark/60">Loading testimonials…</div>}
        {!loading && error && (
          <div className="p-10 text-center">
            <p className="text-sm text-brand-dark/70 mb-3">{error}</p>
            <button onClick={refetch} className="text-xs uppercase tracking-widest text-brand-accent">
              Try again
            </button>
          </div>
        )}
        {!loading && !error && testimonials && testimonials.length === 0 && (
          <p className="p-10 text-center text-sm text-brand-dark/60">No testimonials yet.</p>
        )}
        {!loading && !error && testimonials && testimonials.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-line text-left text-xs uppercase tracking-wider text-brand-muted">
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {testimonials.map((testimonial) => (
                <tr key={testimonial.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {testimonial.image ? (
                        <img
                          src={testimonial.image}
                          alt=""
                          className="h-9 w-9 rounded-full object-cover bg-brand-sand/50 shrink-0"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-brand-sand/50 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-brand-dark truncate">{testimonial.clientName}</p>
                        {testimonial.projectTitle && (
                          <p className="text-xs text-brand-muted truncate">{testimonial.projectTitle}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RatingStars rating={testimonial.rating} />
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleActive(testimonial)}>
                      <StatusBadge
                        label={testimonial.isActive ? 'Active' : 'Inactive'}
                        tone={testimonial.isActive ? 'positive' : 'neutral'}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        aria-label="Edit testimonial"
                        onClick={() => openEditModal(testimonial)}
                        className="p-1.5 text-brand-muted hover:text-brand-dark transition-colors"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete testimonial"
                        onClick={() => setDeletingTestimonial(testimonial)}
                        className="p-1.5 text-brand-muted hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTestimonial ? 'Edit Testimonial' : 'New Testimonial'}
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Client Name" htmlFor="clientName" error={errors.clientName?.message}>
              <input id="clientName" className={inputClassName} {...register('clientName')} />
            </FormField>
            <FormField label="Project Title (optional)" htmlFor="projectTitle">
              <input id="projectTitle" className={inputClassName} {...register('projectTitle')} />
            </FormField>
          </div>

          <FormField label="Content" htmlFor="content" error={errors.content?.message}>
            <textarea id="content" rows={4} className={inputClassName} {...register('content')} />
          </FormField>

          <ImageUploader
            label="Client Photo (optional)"
            value={image}
            onChange={(url) => setValue('image', url)}
            onRemove={() => setValue('image', '')}
          />

          <div className="flex items-center gap-6">
            <FormField label="Rating" htmlFor="rating" className="w-28">
              <select id="rating" className={inputClassName} {...register('rating')}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </FormField>
            <label className="flex items-center gap-2 text-sm text-brand-dark mt-5">
              <input type="checkbox" className="h-4 w-4" {...register('isActive')} />
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 text-xs uppercase tracking-wider border border-brand-dark/30 hover:border-brand-dark transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs uppercase tracking-wider bg-brand-dark text-brand-cream hover:bg-[#3d251c] transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Saving…' : 'Save Testimonial'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingTestimonial)}
        title="Delete this testimonial?"
        description={`The testimonial from "${deletingTestimonial?.clientName}" will be removed from the public site.`}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingTestimonial(null)}
      />
    </div>
  )
}
