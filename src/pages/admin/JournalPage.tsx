import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAsync } from '../../hooks/useAsync'
import {
  adminCreateJournalPost,
  adminDeleteJournalPost,
  adminListJournal,
  adminUpdateJournalPost,
} from '../../services/journal'
import { journalSchema, type JournalFormInput, type JournalFormValues } from '../../lib/schemas'
import { ApiClientError } from '../../lib/api'
import type { ApiJournalPost } from '../../types/api'
import Modal from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/admin/StatusBadge'
import Pagination from '../../components/admin/Pagination'
import FormField, { inputClassName } from '../../components/admin/FormField'
import ImageUploader from '../../components/admin/ImageUploader'

const PAGE_SIZE = 10

const emptyValues: JournalFormInput = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  coverImage: '',
  published: false,
}

function toFormValues(post: ApiJournalPost): JournalFormInput {
  return {
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt ?? '',
    coverImage: post.coverImage ?? '',
    published: post.published,
  }
}

export default function JournalPage() {
  const [page, setPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<ApiJournalPost | null>(null)
  const [deletingPost, setDeletingPost] = useState<ApiJournalPost | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchPosts = useCallback(() => adminListJournal({ page, limit: PAGE_SIZE }), [page])
  const { data, loading, error, refetch } = useAsync(fetchPosts)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<JournalFormInput, unknown, JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: emptyValues,
  })

  const openCreateModal = () => {
    setEditingPost(null)
    reset(emptyValues)
    setIsModalOpen(true)
  }

  const openEditModal = (post: ApiJournalPost) => {
    setEditingPost(post)
    reset(toFormValues(post))
    setIsModalOpen(true)
  }

  const onSubmit = async (values: JournalFormValues) => {
    try {
      const payload = { ...values, slug: values.slug || undefined }
      const { message } = editingPost
        ? await adminUpdateJournalPost(editingPost.id, payload)
        : await adminCreateJournalPost(payload)
      toast.success(message ?? 'Saved successfully')
      setIsModalOpen(false)
      refetch()
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to save post')
    }
  }

  const togglePublished = async (post: ApiJournalPost) => {
    try {
      await adminUpdateJournalPost(post.id, { published: !post.published })
      toast.success(post.published ? 'Moved to draft' : 'Published')
      refetch()
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to update post')
    }
  }

  const handleDelete = async () => {
    if (!deletingPost) return
    setIsDeleting(true)
    try {
      const { message } = await adminDeleteJournalPost(deletingPost.id)
      toast.success(message ?? 'Post deleted')
      setDeletingPost(null)
      refetch()
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Failed to delete post')
    } finally {
      setIsDeleting(false)
    }
  }

  const coverImage = watch('coverImage')

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-brand-muted mb-2">Content</p>
          <h1 className="font-serif-editorial text-3xl text-brand-dark">Journal</h1>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-brand-dark text-brand-cream px-5 py-2.5 text-xs uppercase tracking-wider hover:bg-[#3d251c] transition-colors"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          New Post
        </button>
      </div>

      <div className="bg-white border border-brand-line overflow-x-auto">
        {loading && <div className="p-10 text-center text-sm text-brand-dark/60">Loading posts…</div>}
        {!loading && error && (
          <div className="p-10 text-center">
            <p className="text-sm text-brand-dark/70 mb-3">{error}</p>
            <button onClick={refetch} className="text-xs uppercase tracking-widest text-brand-accent">
              Try again
            </button>
          </div>
        )}
        {!loading && !error && data && data.items.length === 0 && (
          <p className="p-10 text-center text-sm text-brand-dark/60">No journal posts yet.</p>
        )}
        {!loading && !error && data && data.items.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-line text-left text-xs uppercase tracking-wider text-brand-muted">
                <th className="px-4 py-3 font-medium">Post</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {data.items.map((post) => (
                <tr key={post.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {post.coverImage ? (
                        <img src={post.coverImage} alt="" className="h-10 w-14 object-cover bg-brand-sand/50 shrink-0" />
                      ) : (
                        <div className="h-10 w-14 bg-brand-sand/50 shrink-0" />
                      )}
                      <p className="font-medium text-brand-dark truncate">{post.title}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => togglePublished(post)}>
                      <StatusBadge
                        label={post.published ? 'Published' : 'Draft'}
                        tone={post.published ? 'positive' : 'neutral'}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        aria-label="Edit post"
                        onClick={() => openEditModal(post)}
                        className="p-1.5 text-brand-muted hover:text-brand-dark transition-colors"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete post"
                        onClick={() => setDeletingPost(post)}
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
        title={editingPost ? 'Edit Post' : 'New Post'}
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
          </div>

          <FormField label="Excerpt" htmlFor="excerpt">
            <input id="excerpt" className={inputClassName} {...register('excerpt')} />
          </FormField>

          <FormField label="Content" htmlFor="content" error={errors.content?.message}>
            <textarea id="content" rows={8} className={inputClassName} {...register('content')} />
          </FormField>

          <ImageUploader
            label="Cover Image"
            value={coverImage}
            onChange={(url) => setValue('coverImage', url)}
            onRemove={() => setValue('coverImage', '')}
          />

          <label className="flex items-center gap-2 text-sm text-brand-dark">
            <input type="checkbox" className="h-4 w-4" {...register('published')} />
            Published
          </label>

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
              {isSubmitting ? 'Saving…' : 'Save Post'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingPost)}
        title="Delete this post?"
        description={`"${deletingPost?.title}" will be removed from the journal. This can't be undone from here.`}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingPost(null)}
      />
    </div>
  )
}
