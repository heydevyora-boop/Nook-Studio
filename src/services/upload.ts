import { api } from '../lib/api'
import type { ApiSuccess, UploadResult } from '../types/api'

export async function uploadImage(file: File): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await api.post<ApiSuccess<UploadResult>>('/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data
}
