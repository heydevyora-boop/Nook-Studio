import { api } from '../lib/api'
import type { ApiJournalPost, ApiSuccess, Paginated } from '../types/api'
import type { JournalFormValues } from '../lib/schemas'

interface ListParams {
  page?: number
  limit?: number
}

export async function listPublishedJournal(params: ListParams = {}): Promise<Paginated<ApiJournalPost>> {
  const res = await api.get<ApiSuccess<ApiJournalPost[]>>('/journal', { params })
  return { items: res.data.data, meta: res.data.meta! }
}

export async function getJournalBySlug(slug: string): Promise<ApiJournalPost> {
  const res = await api.get<ApiSuccess<ApiJournalPost>>(`/journal/${slug}`)
  return res.data.data
}

export async function adminListJournal(params: ListParams = {}): Promise<Paginated<ApiJournalPost>> {
  const res = await api.get<ApiSuccess<ApiJournalPost[]>>('/admin/journal', { params })
  return { items: res.data.data, meta: res.data.meta! }
}

export async function adminCreateJournalPost(
  payload: JournalFormValues,
): Promise<{ data: ApiJournalPost; message?: string }> {
  const res = await api.post<ApiSuccess<ApiJournalPost>>('/admin/journal', payload)
  return { data: res.data.data, message: res.data.message }
}

export async function adminUpdateJournalPost(
  id: string,
  payload: Partial<JournalFormValues>,
): Promise<{ data: ApiJournalPost; message?: string }> {
  const res = await api.patch<ApiSuccess<ApiJournalPost>>(`/admin/journal/${id}`, payload)
  return { data: res.data.data, message: res.data.message }
}

export async function adminDeleteJournalPost(id: string): Promise<{ message?: string }> {
  const res = await api.delete<ApiSuccess<{ id: string }>>(`/admin/journal/${id}`)
  return { message: res.data.message }
}
