import { z } from 'zod'

export const createJournalSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, alphanumeric and hyphen-separated')
    .optional(),
  content: z.string().min(20, 'Content must be at least 20 characters'),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  published: z.boolean().default(false),
})

export const updateJournalSchema = createJournalSchema.partial()

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

export const idParamSchema = z.object({ id: z.string().min(1) })
export const slugParamSchema = z.object({ slug: z.string().min(1) })

export type CreateJournalInput = z.infer<typeof createJournalSchema>
export type UpdateJournalInput = z.infer<typeof updateJournalSchema>
