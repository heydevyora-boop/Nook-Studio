import { prisma } from '../../lib/prisma'
import { ApiError } from '../../utils/ApiError'
import { generateUniqueSlug } from '../../utils/slugify'
import type { CreateServiceInput, UpdateServiceInput } from './services.schema'

async function isSlugTaken(slug: string, excludeId?: string) {
  const existing = await prisma.service.findUnique({ where: { slug } })
  return Boolean(existing && existing.id !== excludeId)
}

export const servicesService = {
  async listActive() {
    return prisma.service.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { order: 'asc' },
    })
  },

  async listAll() {
    return prisma.service.findMany({ where: { deletedAt: null }, orderBy: { order: 'asc' } })
  },

  async getByIdOrThrow(id: string) {
    const service = await prisma.service.findFirst({ where: { id, deletedAt: null } })
    if (!service) throw ApiError.notFound('Service not found')
    return service
  },

  async create(input: CreateServiceInput) {
    const slug = input.slug ?? (await generateUniqueSlug(input.title, { isTaken: isSlugTaken }))
    if (input.slug && (await isSlugTaken(input.slug))) {
      throw ApiError.conflict('A service with this slug already exists.')
    }
    return prisma.service.create({ data: { ...input, slug } })
  },

  async update(id: string, input: UpdateServiceInput) {
    await this.getByIdOrThrow(id)
    if (input.slug && (await isSlugTaken(input.slug, id))) {
      throw ApiError.conflict('A service with this slug already exists.')
    }
    return prisma.service.update({ where: { id }, data: input })
  },

  async softDelete(id: string) {
    await this.getByIdOrThrow(id)
    await prisma.service.update({ where: { id }, data: { deletedAt: new Date() } })
  },
}
