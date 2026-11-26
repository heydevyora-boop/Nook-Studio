import { useCallback, useState } from 'react'
import { Eye } from 'lucide-react'
import { toast } from 'sonner'
import { useAsync } from '../../hooks/useAsync'
import { adminListInquiries, adminUpdateInquiryStatus } from '../../services/inquiries'
import { ApiClientError } from '../../lib/api'
import { inputClassName } from '../../components/admin/FormField'
import type { ApiInquiry, InquiryStatus } from '../../types/api'
import Modal from '../../components/admin/Modal'
import Pagination from '../../components/admin/Pagination'

const PAGE_SIZE = 15
const STATUS_OPTIONS: InquiryStatus[] = ['NEW', 'CONTACTED', 'CLOSED']

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function statusSelectClasses(status: InquiryStatus): string {
  if (status === 'NEW') return 'border-brand-accent text-brand-accent'
  if (status === 'CLOSED') return 'border-brand-line text-brand-muted'
  return 'border-emerald-600 text-emerald-700'
}

export default function InquiriesPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | ''>('')
  const [viewingInquiry, setViewingInquiry] = useState<ApiInquiry | null>(null)

  const fetchInquiries = useCallback(
    () => adminListInquiries({ page, limit: PAGE_SIZE, status: statusFilter || undefined }),
    [page, statusFilter],
  )
  const { data, loading, error, refetch } = useAsync(fetchInquiries)

  const changeStatus = async (inquiry: ApiInquiry, status: InquiryStatus) => {
    try {
      await adminUpdateInquiryStatus(inquiry.id, status)
      toast.success('Status updated')
      refetch()
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Failed to update status')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-muted mb-2">Content</p>
        <h1 className="font-serif-editorial text-3xl text-brand-dark">Inquiries</h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as InquiryStatus | '')
            setPage(1)
          }}
          className={`${inputClassName} w-auto`}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-brand-line overflow-x-auto">
        {loading && <div className="p-10 text-center text-sm text-brand-dark/60">Loading inquiries…</div>}
        {!loading && error && (
          <div className="p-10 text-center">
            <p className="text-sm text-brand-dark/70 mb-3">{error}</p>
            <button onClick={refetch} className="text-xs uppercase tracking-widest text-brand-accent">
              Try again
            </button>
          </div>
        )}
        {!loading && !error && data && data.items.length === 0 && (
          <p className="p-10 text-center text-sm text-brand-dark/60">No inquiries yet.</p>
        )}
        {!loading && !error && data && data.items.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-line text-left text-xs uppercase tracking-wider text-brand-muted">
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {data.items.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-brand-dark">{inquiry.name}</p>
                    <p className="text-xs text-brand-muted">{inquiry.email}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{inquiry.projectType ?? '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-brand-muted">
                    {dateFormatter.format(new Date(inquiry.createdAt))}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={inquiry.status}
                      onChange={(e) => changeStatus(inquiry, e.target.value as InquiryStatus)}
                      className={`bg-transparent border px-2 py-1 text-xs uppercase tracking-wider focus:outline-none ${statusSelectClasses(inquiry.status)}`}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      aria-label="View inquiry"
                      onClick={() => setViewingInquiry(inquiry)}
                      className="p-1.5 text-brand-muted hover:text-brand-dark transition-colors"
                    >
                      <Eye className="h-4 w-4" strokeWidth={1.5} />
                    </button>
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
        isOpen={Boolean(viewingInquiry)}
        onClose={() => setViewingInquiry(null)}
        title={viewingInquiry?.name ?? 'Inquiry'}
      >
        {viewingInquiry && (
          <div className="flex flex-col gap-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-brand-muted">Email</p>
                <p className="text-brand-dark">{viewingInquiry.email}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-brand-muted">Phone</p>
                <p className="text-brand-dark">{viewingInquiry.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-brand-muted">Project Type</p>
                <p className="text-brand-dark">{viewingInquiry.projectType ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-brand-muted">Budget</p>
                <p className="text-brand-dark">{viewingInquiry.budgetRange ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-brand-muted">Area</p>
                <p className="text-brand-dark">
                  {viewingInquiry.areaSqFt ? `${viewingInquiry.areaSqFt} sq. ft.` : '—'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-brand-muted mb-1">Message</p>
              <p className="text-brand-dark whitespace-pre-wrap leading-relaxed">{viewingInquiry.message}</p>
            </div>
            <p className="text-xs text-brand-muted">
              Received {dateFormatter.format(new Date(viewingInquiry.createdAt))}
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
