import { z } from 'zod'

export const createTestimonialSchema = z.object({
  clientName: z.string().min(2, 'Client name must be at least 2 characters'),
  projectTitle: z.string().optional(),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const updateTestimonialSchema = createTestimonialSchema.partial()

export const idParamSchema = z.object({ id: z.string().min(1) })

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>
