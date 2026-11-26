import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})
export type LoginFormValues = z.infer<typeof loginSchema>

export const inquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z.string().optional(),
  projectType: z.string().optional(),
  budget: z.string().optional(),
  areaSqFt: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})
export type InquiryFormValues = z.infer<typeof inquirySchema>

const slugField = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only')
  .optional()
  .or(z.literal(''))

export const projectSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  slug: slugField,
  location: z.string().optional(),
  category: z.enum(['INTERIOR_DESIGN', 'PRODUCT_DESIGN', 'SPACE_PLANNING', 'DESIGN_CONSULTATION']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().optional(),
  coverImage: z.string().min(1, 'A cover image is required'),
  images: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  year: z
    .union([z.coerce.number().int().min(1900).max(2100), z.literal('')])
    .optional()
    .transform((value) => (value === '' || value === undefined ? undefined : value)),
  client: z.string().optional(),
})
export type ProjectFormValues = z.infer<typeof projectSchema>
export type ProjectFormInput = z.input<typeof projectSchema>

export const journalSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  slug: slugField,
  content: z.string().min(20, 'Content must be at least 20 characters'),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  published: z.boolean().default(false),
})
export type JournalFormValues = z.infer<typeof journalSchema>
export type JournalFormInput = z.input<typeof journalSchema>

export const serviceSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  slug: slugField,
  description: z.string().min(5, 'Description must be at least 5 characters'),
  icon: z.string().min(1, 'Choose an icon'),
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
})
export type ServiceFormValues = z.infer<typeof serviceSchema>
export type ServiceFormInput = z.input<typeof serviceSchema>

export const testimonialSchema = z.object({
  clientName: z.string().min(2, 'Client name must be at least 2 characters'),
  projectTitle: z.string().optional(),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
})
export type TestimonialFormValues = z.infer<typeof testimonialSchema>
export type TestimonialFormInput = z.input<typeof testimonialSchema>
