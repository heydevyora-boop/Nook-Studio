import { api } from '../lib/api'
import type { ApiService, ApiSuccess } from '../types/api'
import type { ServiceFormValues } from '../lib/schemas'

export async function listActiveServices(): Promise<ApiService[]> {
  const res = await api.get<ApiSuccess<ApiService[]>>('/services')
  return res.data.data
}

export async function adminListServices(): Promise<ApiService[]> {
  const res = await api.get<ApiSuccess<ApiService[]>>('/admin/services')
  return res.data.data
}

export async function adminCreateService(
  payload: ServiceFormValues,
): Promise<{ data: ApiService; message?: string }> {
  const res = await api.post<ApiSuccess<ApiService>>('/admin/services', payload)
  return { data: res.data.data, message: res.data.message }
}

export async function adminUpdateService(
  id: string,
  payload: Partial<ServiceFormValues>,
): Promise<{ data: ApiService; message?: string }> {
  const res = await api.patch<ApiSuccess<ApiService>>(`/admin/services/${id}`, payload)
  return { data: res.data.data, message: res.data.message }
}

export async function adminDeleteService(id: string): Promise<{ message?: string }> {
  const res = await api.delete<ApiSuccess<{ id: string }>>(`/admin/services/${id}`)
  return { message: res.data.message }
}
