import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useAsync } from '../../hooks/useAsync'
import {
  adminCreateProject,
  adminDeleteProject,
  adminListProjects,
  adminUpdateProject,
} from '../../services/projects'
import { projectSchema, type ProjectFormInput, type ProjectFormValues } from '../../lib/schemas'
import { ApiClientError } from '../../lib/api'
import { CATEGORY_LABELS, CATEGORY_OPTIONS } from '../../lib/projectCategory'
import type { ApiProject, ContentStatus, ProjectCategory } from '../../types/api'
import Modal from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/admin/StatusBadge'
import Pagination from '../../components/admin/Pagination'
import FormField, { inputClassName } from '../../components/admin/FormField'
import ImageUploader from '../../components/admin/ImageUploader'
import MultiImageUploader from '../../components/admin/MultiImageUploader'

const PAGE_SIZE = 10

const emptyValues: ProjectFormInput = {
  title: '',
  slug: '',
  location: '',
  category: 'INTERIOR_DESIGN',
  description: '',
  shortDescription: '',
  coverImage: '',
  images: [],
  featured: false,
  status: 'DRAFT',
  year: undefined,
  client: '',
}

function toFormValues(project: ApiProject): ProjectFormInput {
  return {
    title: project.title,
    slug: project.slug,
    location: project.location ?? '',
    category: project.category,
    description: project.description,
    shortDescription: project.shortDescription ?? '',
    coverImage: project.coverImage,
    images: project.images,
    featured: project.featured,
    status: project.status,
    year: project.year ?? undefined,
    client: project.client ?? '',
  }
}

export default function ProjectsPage() {
  const [page, setPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | ''>('')
  const [statusFilter, setStatusFilter] = useState<ContentStatus | ''>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ApiProject | null>(null)
  const [deletingProject, setDeletingProject] = useState<ApiProject | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchProjects = useCallback(
    () =>
      adminListProjects({
        page,
        limit: PAGE_SIZE,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
      }),
    [page, categoryFilter, statusFilter],
  )
  const { data, loading, error, refetch } = useAsync(fetchProjects)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormInput, unknown, ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: emptyValues,
  })

  const openCreateModal = () => {
    setEditingProject(null)
    reset(emptyValues)
    setIsModalOpen(true)
  }

  const openEditModal = (project: ApiProject) => {
    setEditingProject(project)
    reset(toFormValues(project))
    setIsModalOpen(true)
  }

  const onSubmit = async (values: ProjectFormValues) => {
    try {
      const payload = { ...values, slug: values.slug || undefined }
      const { message } = editingProject
        ? await adminUpdateProject(editingProject.id, payload)
        : await adminCreateProject(payload)
      toast.success(message ?? 'Saved successfully')
      setIsModalOpen(false)
      refetch()
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to save project')
    }
  }

  const toggleFeatured = async (project: ApiProject) => {
    try {
      await adminUpdateProject(project.id, { featured: !project.featured })
      toast.success(project.featured ? 'Removed from featured' : 'Marked as featured')
      refetch()
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to update project')
    }
  }

  const toggleStatus = async (project: ApiProject) => {
    const nextStatus: ContentStatus = project.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    try {
      await adminUpdateProject(project.id, { status: nextStatus })
      toast.success(`Project ${nextStatus === 'PUBLISHED' ? 'published' : 'moved to draft'}`)
      refetch()
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to update project')
    }
  }

  const handleDelete = async () => {
    if (!deletingProject) return
    setIsDeleting(true)
    try {
      const { message } = await adminDeleteProject(deletingProject.id)
      toast.success(message ?? 'Project deleted')
      setDeletingProject(null)
      refetch()
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to delete project')
    } finally {
      setIsDeleting(false)
    }
  }

  const coverImage = watch('coverImage')
  const images = watch('images')

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-brand-muted mb-2">Content</p>
          <h1 className="font-serif-editorial text-3xl text-brand-dark">Projects</h1>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-brand-dark text-brand-cream px-5 py-2.5 text-xs uppercase tracking-wider hover:bg-[#3d251c] transition-colors"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          New Project
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value as ProjectCategory | '')
            setPage(1)
          }}
          className={`${inputClassName} w-auto`}
        >
          <option value="">All categories</option>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as ContentStatus | '')
            setPage(1)
          }}
          className={`${inputClassName} w-auto`}
        >
          <option value="">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      <div className="bg-white border border-brand-line overflow-x-auto">
        {loading && <div className="p-10 text-center text-sm text-brand-dark/60">Loading projects…</div>}
        {!loading && error && (
          <div className="p-10 text-center">
            <p className="text-sm text-brand-dark/70 mb-3">{error}</p>
            <button onClick={refetch} className="text-xs uppercase tracking-widest text-brand-accent">
              Try again
            </button>
          </div>
        )}
        {!loading && !error && data && data.items.length === 0 && (
          <p className="p-10 text-center text-sm text-brand-dark/60">No projects yet — create your first one.</p>
        )}
        {!loading && !error && data && data.items.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-line text-left text-xs uppercase tracking-wider text-brand-muted">
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Featured</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {data.items.map((project) => (
                <tr key={project.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={project.coverImage}
                        alt=""
                        className="h-10 w-14 object-cover bg-brand-sand/50 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-brand-dark truncate">{project.title}</p>
                        <p className="text-xs text-brand-muted truncate">{project.location ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{CATEGORY_LABELS[project.category]}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => toggleStatus(project)}>
                      <StatusBadge
                        label={project.status}
                        tone={project.status === 'PUBLISHED' ? 'positive' : 'neutral'}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      aria-label="Toggle featured"
                      onClick={() => toggleFeatured(project)}
                      className={project.featured ? 'text-brand-accent' : 'text-brand-muted/50'}
                    >
                      <Star className="h-4 w-4" fill={project.featured ? 'currentColor' : 'none'} strokeWidth={1.5} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        aria-label="Edit project"
                        onClick={() => openEditModal(project)}
                        className="p-1.5 text-brand-muted hover:text-brand-dark transition-colors"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete project"
                        onClick={() => setDeletingProject(project)}
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

      {data && (
        <div className="px-1">
          <Pagination meta={data.meta} onPageChange={setPage} />
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? 'Edit Project' : 'New Project'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Title" htmlFor="title" error={errors.title?.message}>
              <input id="title" className={inputClassName} {...register('title')} />
            </FormField>
            <FormField label="Slug (optional)" htmlFor="slug" error={errors.slug?.message}>
              <input id="slug" placeholder="auto-generated" className={inputClassName} {...register('slug')} />
            </FormField>
            <FormField label="Category" htmlFor="category" error={errors.category?.message}>
              <select id="category" className={inputClassName} {...register('category')}>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Location" htmlFor="location">
              <input id="location" className={inputClassName} {...register('location')} />
            </FormField>
            <FormField label="Year" htmlFor="year" error={errors.year?.message}>
              <input id="year" type="number" className={inputClassName} {...register('year')} />
            </FormField>
            <FormField label="Client (optional)" htmlFor="client">
              <input id="client" className={inputClassName} {...register('client')} />
            </FormField>
          </div>

          <FormField label="Short Description" htmlFor="shortDescription">
            <input
              id="shortDescription"
              placeholder="e.g. Interior & Styling — New Delhi"
              className={inputClassName}
              {...register('shortDescription')}
            />
          </FormField>

          <FormField label="Description" htmlFor="description" error={errors.description?.message}>
            <textarea id="description" rows={4} className={inputClassName} {...register('description')} />
          </FormField>

          <ImageUploader
            label="Cover Image"
            value={coverImage}
            onChange={(url) => setValue('coverImage', url, { shouldValidate: true })}
            onRemove={() => setValue('coverImage', '', { shouldValidate: true })}
            error={errors.coverImage?.message}
          />

          <MultiImageUploader
            label="Additional Images"
            value={images ?? []}
            onChange={(urls) => setValue('images', urls)}
          />

          <div className="flex items-center gap-6">
            <FormField label="Status" htmlFor="status">
              <select id="status" className={inputClassName} {...register('status')}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </FormField>
            <label className="flex items-center gap-2 text-sm text-brand-dark mt-5">
              <input type="checkbox" className="h-4 w-4" {...register('featured')} />
              Featured
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
              {isSubmitting ? 'Saving…' : 'Save Project'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingProject)}
        title="Delete this project?"
        description={`"${deletingProject?.title}" will be removed from the public site. This can't be undone from here.`}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingProject(null)}
      />
    </div>
  )
}
