import { api } from '../lib/api'
import type { ApiInquiry, ApiSuccess, InquiryStatus, Paginated } from '../types/api'
import type { InquiryFormValues } from '../lib/schemas'

export async function submitInquiry(payload: InquiryFormValues): Promise<{ message?: string }> {
  const res = await api.post<ApiSuccess<ApiInquiry>>('/inquiries', payload)
  return { message: res.data.message }
}

interface AdminListParams {
  page?: number
  limit?: number
  status?: InquiryStatus
}

export async function adminListInquiries(params: AdminListParams = {}): Promise<Paginated<ApiInquiry>> {
  const res = await api.get<ApiSuccess<ApiInquiry[]>>('/admin/inquiries', { params })
  return { items: res.data.data, meta: res.data.meta! }
}

export async function adminUpdateInquiryStatus(
  id: string,
  status: InquiryStatus,
): Promise<{ data: ApiInquiry; message?: string }> {
  const res = await api.patch<ApiSuccess<ApiInquiry>>(`/admin/inquiries/${id}`, { status })
  return { data: res.data.data, message: res.data.message }
}
