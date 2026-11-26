import { z } from 'zod'
import { ContentStatus, ProjectCategory } from '@prisma/client'

const urlOrPath = z.string().min(1, 'A value is required')

export const createProjectSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, alphanumeric and hyphen-separated')
    .optional(),
  location: z.string().optional(),
  category: z.nativeEnum(ProjectCategory),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().optional(),
  coverImage: urlOrPath,
  images: z.array(urlOrPath).default([]),
  featured: z.boolean().default(false),
  status: z.nativeEnum(ContentStatus).default(ContentStatus.DRAFT),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  client: z.string().optional(),
})

export const updateProjectSchema = createProjectSchema.partial()

export const publicProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  category: z.nativeEnum(ProjectCategory).optional(),
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
})

export const adminProjectsQuerySchema = publicProjectsQuerySchema.extend({
  status: z.nativeEnum(ContentStatus).optional(),
})

export const slugParamSchema = z.object({ slug: z.string().min(1) })
export const idParamSchema = z.object({ id: z.string().min(1) })

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
