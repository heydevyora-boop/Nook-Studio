import { ContentStatus, type Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { ApiError } from '../../utils/ApiError'
import { generateUniqueSlug } from '../../utils/slugify'
import { toPaginationMeta, toSkipTake } from '../../utils/pagination'
import type { CreateProjectInput, UpdateProjectInput } from './projects.schema'

interface ListFilters {
  page: number
  limit: number
  category?: Prisma.ProjectWhereInput['category']
  featured?: boolean
  status?: ContentStatus
}

async function isSlugTaken(slug: string, excludeId?: string) {
  const existing = await prisma.project.findUnique({ where: { slug } })
  return Boolean(existing && existing.id !== excludeId)
}

export const projectsService = {
  async listPublished({ page, limit, category, featured }: Omit<ListFilters, 'status'>) {
    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      status: ContentStatus.PUBLISHED,
      ...(category ? { category } : {}),
      ...(featured !== undefined ? { featured } : {}),
    }

    const [items, total] = await Promise.all([
      prisma.project.findMany({ where, orderBy: { createdAt: 'desc' }, ...toSkipTake(page, limit) }),
      prisma.project.count({ where }),
    ])

    return { items, meta: toPaginationMeta(page, limit, total) }
  },

  async getPublishedBySlug(slug: string) {
    const project = await prisma.project.findFirst({
      where: { slug, status: ContentStatus.PUBLISHED, deletedAt: null },
    })
    if (!project) throw ApiError.notFound('Project not found')
    return project
  },

  async listAll({ page, limit, category, featured, status }: ListFilters) {
    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      ...(category ? { category } : {}),
      ...(featured !== undefined ? { featured } : {}),
      ...(status ? { status } : {}),
    }

    const [items, total] = await Promise.all([
      prisma.project.findMany({ where, orderBy: { createdAt: 'desc' }, ...toSkipTake(page, limit) }),
      prisma.project.count({ where }),
    ])

    return { items, meta: toPaginationMeta(page, limit, total) }
  },

  async getByIdOrThrow(id: string) {
    const project = await prisma.project.findFirst({ where: { id, deletedAt: null } })
    if (!project) throw ApiError.notFound('Project not found')
    return project
  },

  async create(input: CreateProjectInput) {
    const slug = input.slug ?? (await generateUniqueSlug(input.title, { isTaken: isSlugTaken }))
    if (input.slug && (await isSlugTaken(input.slug))) {
      throw ApiError.conflict('A project with this slug already exists.')
    }

    return prisma.project.create({ data: { ...input, slug } })
  },

  async update(id: string, input: UpdateProjectInput) {
    await this.getByIdOrThrow(id)

    if (input.slug && (await isSlugTaken(input.slug, id))) {
      throw ApiError.conflict('A project with this slug already exists.')
    }

    return prisma.project.update({ where: { id }, data: input })
  },

  async softDelete(id: string) {
    await this.getByIdOrThrow(id)
    await prisma.project.update({ where: { id }, data: { deletedAt: new Date() } })
  },
}
