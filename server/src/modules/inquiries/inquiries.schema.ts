import { z } from 'zod'
import { InquiryStatus } from '@prisma/client'

export const createInquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('A valid email is required'),
  phone: z.string().optional(),
  projectType: z.string().optional(),
  budget: z.string().optional(),
  areaSqFt: z.coerce.number().int().positive().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export const updateInquiryStatusSchema = z.object({
  status: z.nativeEnum(InquiryStatus),
})

export const adminInquiriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(InquiryStatus).optional(),
})

export const idParamSchema = z.object({ id: z.string().min(1) })

export type CreateInquiryInput = z.infer<typeof createInquirySchema>
