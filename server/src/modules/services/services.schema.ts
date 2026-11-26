import { z } from 'zod'

export const createServiceSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, alphanumeric and hyphen-separated')
    .optional(),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  icon: z.string().min(1, 'Icon identifier is required'),
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
})

export const updateServiceSchema = createServiceSchema.partial()

export const idParamSchema = z.object({ id: z.string().min(1) })
export const slugParamSchema = z.object({ slug: z.string().min(1) })

export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>
