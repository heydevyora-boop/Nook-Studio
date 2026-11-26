// Types mirroring the backend's Prisma models and response envelope
// (see server/prisma/schema.prisma and server/src/utils/ApiResponse.ts).

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
  meta?: PaginationMeta
}

export interface ApiFailure {
  success: false
  data: null
  message: string
  details?: Record<string, string[]>
}

export type ProjectCategory =
  | 'INTERIOR_DESIGN'
  | 'PRODUCT_DESIGN'
  | 'SPACE_PLANNING'
  | 'DESIGN_CONSULTATION'

export type ContentStatus = 'DRAFT' | 'PUBLISHED'

export type InquiryStatus = 'NEW' | 'CONTACTED' | 'CLOSED'

export type Role = 'ADMIN' | 'STAFF' | 'USER'

export interface ApiProject {
  id: string
  title: string
  slug: string
  location: string | null
  category: ProjectCategory
  description: string
  shortDescription: string | null
  coverImage: string
  images: string[]
  featured: boolean
  status: ContentStatus
  year: number | null
  client: string | null
  createdAt: string
  updatedAt: string
}

export interface ApiService {
  id: string
  title: string
  slug: string
  description: string
  icon: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ApiJournalPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  coverImage: string | null
  published: boolean
  publishedAt: string | null
  authorId: string | null
  createdAt: string
  updatedAt: string
}

export interface ApiInquiry {
  id: string
  name: string
  email: string
  phone: string | null
  projectType: string | null
  budgetRange: string | null
  areaSqFt: number | null
  message: string
  status: InquiryStatus
  createdAt: string
  updatedAt: string
}

export interface ApiTestimonial {
  id: string
  clientName: string
  projectTitle: string | null
  content: string
  rating: number
  image: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminUser {
  id: string
  name: string
  username: string
  email: string
  role: Role
  createdAt: string
}

export interface UploadResult {
  url: string
  publicId: string
}

export interface Paginated<T> {
  items: T[]
  meta: PaginationMeta
}
