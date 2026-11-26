import { api } from '../lib/api'
import type { ApiProject, ApiSuccess, ContentStatus, Paginated, ProjectCategory } from '../types/api'
import type { ProjectFormValues } from '../lib/schemas'

interface PublicListParams {
  page?: number
  limit?: number
  category?: ProjectCategory
  featured?: boolean
}

interface AdminListParams extends PublicListParams {
  status?: ContentStatus
}

export async function listPublishedProjects(params: PublicListParams = {}): Promise<Paginated<ApiProject>> {
  const res = await api.get<ApiSuccess<ApiProject[]>>('/projects', { params })
  return { items: res.data.data, meta: res.data.meta! }
}

export async function getProjectBySlug(slug: string): Promise<ApiProject> {
  const res = await api.get<ApiSuccess<ApiProject>>(`/projects/${slug}`)
  return res.data.data
}

export async function adminListProjects(params: AdminListParams = {}): Promise<Paginated<ApiProject>> {
  const res = await api.get<ApiSuccess<ApiProject[]>>('/admin/projects', { params })
  return { items: res.data.data, meta: res.data.meta! }
}

export async function adminGetProject(id: string): Promise<ApiProject> {
  const res = await api.get<ApiSuccess<ApiProject>>(`/admin/projects/${id}`)
  return res.data.data
}

export async function adminCreateProject(
  payload: ProjectFormValues,
): Promise<{ data: ApiProject; message?: string }> {
  const res = await api.post<ApiSuccess<ApiProject>>('/admin/projects', payload)
  return { data: res.data.data, message: res.data.message }
}

export async function adminUpdateProject(
  id: string,
  payload: Partial<ProjectFormValues>,
): Promise<{ data: ApiProject; message?: string }> {
  const res = await api.patch<ApiSuccess<ApiProject>>(`/admin/projects/${id}`, payload)
  return { data: res.data.data, message: res.data.message }
}

export async function adminDeleteProject(id: string): Promise<{ message?: string }> {
  const res = await api.delete<ApiSuccess<{ id: string }>>(`/admin/projects/${id}`)
  return { message: res.data.message }
}
