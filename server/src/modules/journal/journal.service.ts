import { prisma } from '../../lib/prisma'
import { ApiError } from '../../utils/ApiError'
import { generateUniqueSlug } from '../../utils/slugify'
import { toPaginationMeta, toSkipTake } from '../../utils/pagination'
import type { CreateJournalInput, UpdateJournalInput } from './journal.schema'

async function isSlugTaken(slug: string, excludeId?: string) {
  const existing = await prisma.journalPost.findUnique({ where: { slug } })
  return Boolean(existing && existing.id !== excludeId)
}

export const journalService = {
  async listPublished(page: number, limit: number) {
    const where = { published: true, deletedAt: null }
    const [items, total] = await Promise.all([
      prisma.journalPost.findMany({ where, orderBy: { publishedAt: 'desc' }, ...toSkipTake(page, limit) }),
      prisma.journalPost.count({ where }),
    ])
    return { items, meta: toPaginationMeta(page, limit, total) }
  },

  async getPublishedBySlug(slug: string) {
    const post = await prisma.journalPost.findFirst({ where: { slug, published: true, deletedAt: null } })
    if (!post) throw ApiError.notFound('Journal post not found')
    return post
  },

  async listAll(page: number, limit: number) {
    const where = { deletedAt: null }
    const [items, total] = await Promise.all([
      prisma.journalPost.findMany({ where, orderBy: { createdAt: 'desc' }, ...toSkipTake(page, limit) }),
      prisma.journalPost.count({ where }),
    ])
    return { items, meta: toPaginationMeta(page, limit, total) }
  },

  async getByIdOrThrow(id: string) {
    const post = await prisma.journalPost.findFirst({ where: { id, deletedAt: null } })
    if (!post) throw ApiError.notFound('Journal post not found')
    return post
  },

  async create(input: CreateJournalInput, authorId?: string) {
    const slug = input.slug ?? (await generateUniqueSlug(input.title, { isTaken: isSlugTaken }))
    if (input.slug && (await isSlugTaken(input.slug))) {
      throw ApiError.conflict('A journal post with this slug already exists.')
    }

    return prisma.journalPost.create({
      data: {
        ...input,
        slug,
        authorId,
        publishedAt: input.published ? new Date() : null,
      },
    })
  },

  async update(id: string, input: UpdateJournalInput) {
    const existing = await this.getByIdOrThrow(id)

    if (input.slug && (await isSlugTaken(input.slug, id))) {
      throw ApiError.conflict('A journal post with this slug already exists.')
    }

    const willBePublished = input.published ?? existing.published
    const publishedAt = willBePublished ? (existing.publishedAt ?? new Date()) : existing.publishedAt

    return prisma.journalPost.update({ where: { id }, data: { ...input, publishedAt } })
  },

  async softDelete(id: string) {
    await this.getByIdOrThrow(id)
    await prisma.journalPost.update({ where: { id }, data: { deletedAt: new Date() } })
  },
}
