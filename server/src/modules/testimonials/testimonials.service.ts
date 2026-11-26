import { prisma } from '../../lib/prisma'
import { ApiError } from '../../utils/ApiError'
import type { CreateTestimonialInput, UpdateTestimonialInput } from './testimonials.schema'

export const testimonialsService = {
  async listActive() {
    return prisma.testimonial.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    })
  },

  async listAll() {
    return prisma.testimonial.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } })
  },

  async getByIdOrThrow(id: string) {
    const testimonial = await prisma.testimonial.findFirst({ where: { id, deletedAt: null } })
    if (!testimonial) throw ApiError.notFound('Testimonial not found')
    return testimonial
  },

  async create(input: CreateTestimonialInput) {
    return prisma.testimonial.create({ data: input })
  },

  async update(id: string, input: UpdateTestimonialInput) {
    await this.getByIdOrThrow(id)
    return prisma.testimonial.update({ where: { id }, data: input })
  },

  async softDelete(id: string) {
    await this.getByIdOrThrow(id)
    await prisma.testimonial.update({ where: { id }, data: { deletedAt: new Date() } })
  },
}
