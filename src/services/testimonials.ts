import { api } from '../lib/api'
import type { ApiSuccess, ApiTestimonial } from '../types/api'
import type { TestimonialFormValues } from '../lib/schemas'

export async function listActiveTestimonials(): Promise<ApiTestimonial[]> {
  const res = await api.get<ApiSuccess<ApiTestimonial[]>>('/testimonials')
  return res.data.data
}

export async function adminListTestimonials(): Promise<ApiTestimonial[]> {
  const res = await api.get<ApiSuccess<ApiTestimonial[]>>('/admin/testimonials')
  return res.data.data
}

export async function adminCreateTestimonial(
  payload: TestimonialFormValues,
): Promise<{ data: ApiTestimonial; message?: string }> {
  const res = await api.post<ApiSuccess<ApiTestimonial>>('/admin/testimonials', payload)
  return { data: res.data.data, message: res.data.message }
}

export async function adminUpdateTestimonial(
  id: string,
  payload: Partial<TestimonialFormValues>,
): Promise<{ data: ApiTestimonial; message?: string }> {
  const res = await api.patch<ApiSuccess<ApiTestimonial>>(`/admin/testimonials/${id}`, payload)
  return { data: res.data.data, message: res.data.message }
}

export async function adminDeleteTestimonial(id: string): Promise<{ message?: string }> {
  const res = await api.delete<ApiSuccess<{ id: string }>>(`/admin/testimonials/${id}`)
  return { message: res.data.message }
}
