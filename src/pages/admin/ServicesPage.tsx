import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAsync } from '../../hooks/useAsync'
import {
  adminCreateService,
  adminDeleteService,
  adminListServices,
  adminUpdateService,
} from '../../services/services'
import { serviceSchema, type ServiceFormInput, type ServiceFormValues } from '../../lib/schemas'
import { ApiClientError } from '../../lib/api'
import { ICON_OPTIONS, getServiceIcon } from '../../lib/iconMap'
import type { ApiService } from '../../types/api'
import Modal from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/admin/StatusBadge'
import FormField, { inputClassName } from '../../components/admin/FormField'

const emptyValues: ServiceFormInput = {
  title: '',
  slug: '',
  description: '',
  icon: 'armchair',
  order: 0,
  isActive: true,
}

function toFormValues(service: ApiService): ServiceFormInput {
  return {
    title: service.title,
    slug: service.slug,
    description: service.description,
    icon: service.icon,
    order: service.order,
    isActive: service.isActive,
  }
}

export default function ServicesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<ApiService | null>(null)
  const [deletingService, setDeletingService] = useState<ApiService | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: services, loading, error, refetch } = useAsync(adminListServices)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormInput, unknown, ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: emptyValues,
  })

  const openCreateModal = () => {
    setEditingService(null)
    reset(emptyValues)
    setIsModalOpen(true)
  }

  const openEditModal = (service: ApiService) => {
    setEditingService(service)
    reset(toFormValues(service))
    setIsModalOpen(true)
  }

  const onSubmit = async (values: ServiceFormValues) => {
    try {
      const payload = { ...values, slug: values.slug || undefined }
      const { message } = editingService
        ? await adminUpdateService(editingService.id, payload)
        : await adminCreateService(payload)
      toast.success(message ?? 'Saved successfully')
      setIsModalOpen(false)
      refetch()
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to save service')
    }
  }

  const toggleActive = async (service: ApiService) => {
    try {
      await adminUpdateService(service.id, { isActive: !service.isActive })
      toast.success(service.isActive ? 'Deactivated' : 'Activated')
      refetch()
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to update service')
    }
  }

  const handleDelete = async () => {
    if (!deletingService) return
    setIsDeleting(true)
    try {
      const { message } = await adminDeleteService(deletingService.id)
      toast.success(message ?? 'Service deleted')
      setDeletingService(null)
      refetch()
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to delete service')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-brand-muted mb-2">Content</p>
          <h1 className="font-serif-editorial text-3xl text-brand-dark">Services</h1>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-brand-dark text-brand-cream px-5 py-2.5 text-xs uppercase tracking-wider hover:bg-[#3d251c] transition-colors"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          New Service
        </button>
      </div>

      <div className="bg-white border border-brand-line overflow-x-auto">
        {loading && <div className="p-10 text-center text-sm text-brand-dark/60">Loading services…</div>}
        {!loading && error && (
          <div className="p-10 text-center">
            <p className="text-sm text-brand-dark/70 mb-3">{error}</p>
            <button onClick={refetch} className="text-xs uppercase tracking-widest text-brand-accent">
              Try again
            </button>
          </div>
        )}
        {!loading && !error && services && services.length === 0 && (
          <p className="p-10 text-center text-sm text-brand-dark/60">No services yet.</p>
        )}
        {!loading && !error && services && services.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-line text-left text-xs uppercase tracking-wider text-brand-muted">
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {services.map((service) => {
                const Icon = getServiceIcon(service.icon)
                return (
                  <tr key={service.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-brand-dark shrink-0" strokeWidth={1.5} />
                        <p className="font-medium text-brand-dark">{service.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{service.order}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => toggleActive(service)}>
                        <StatusBadge
                          label={service.isActive ? 'Active' : 'Inactive'}
                          tone={service.isActive ? 'positive' : 'neutral'}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          aria-label="Edit service"
                          onClick={() => openEditModal(service)}
                          className="p-1.5 text-brand-muted hover:text-brand-dark transition-colors"
                        >
                          <Pencil className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete service"
                          onClick={() => setDeletingService(service)}
                          className="p-1.5 text-brand-muted hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'Edit Service' : 'New Service'}
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <FormField label="Title" htmlFor="title" error={errors.title?.message}>
            <input id="title" className={inputClassName} {...register('title')} />
          </FormField>
          <FormField label="Slug (optional)" htmlFor="slug" error={errors.slug?.message}>
            <input id="slug" placeholder="auto-generated" className={inputClassName} {...register('slug')} />
          </FormField>
          <FormField label="Description" htmlFor="description" error={errors.description?.message}>
            <textarea id="description" rows={3} className={inputClassName} {...register('description')} />
          </FormField>
          <FormField label="Icon" htmlFor="icon" error={errors.icon?.message}>
            <select id="icon" className={inputClassName} {...register('icon')}>
              {ICON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          <div className="flex items-center gap-6">
            <FormField label="Order" htmlFor="order" className="w-28">
              <input id="order" type="number" className={inputClassName} {...register('order')} />
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
              {isSubmitting ? 'Saving…' : 'Save Service'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingService)}
        title="Delete this service?"
        description={`"${deletingService?.title}" will be removed from the public site.`}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingService(null)}
      />
    </div>
  )
}
