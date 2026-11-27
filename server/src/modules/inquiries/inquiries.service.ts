import { createHash } from 'node:crypto'
import { InquiryStatus, Prisma, type Inquiry } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { logger } from '../../lib/logger'
import { ApiError } from '../../utils/ApiError'
import { toPaginationMeta, toSkipTake } from '../../utils/pagination'
import { sendMail } from '../../config/mail'
import { env } from '../../config/env'
import { buildAdminNotificationEmail, buildClientConfirmationEmail } from './inquiries.emails'
import type { CreateInquiryInput } from './inquiries.schema'
import { syncNewInquiry } from './inquiries.sheetsSync'

/** Identical submissions inside this window are treated as one (double-click, network retry). */
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000

function buildSubmissionKey(input: CreateInquiryInput): string {
  const fingerprint = [
    input.name,
    input.email,
    input.phone,
    input.projectType,
    input.budget,
    input.areaSqFt,
    input.message,
  ]
    .map((part) => String(part ?? '').trim().toLowerCase())
    .join('\u001f')
  const bucket = Math.floor(Date.now() / DUPLICATE_WINDOW_MS)
  return `${createHash('sha256').update(fingerprint).digest('hex')}:${bucket}`
}

/** Public/admin responses never include the dedupe key; the public one also hides sync internals. */
function toAdminInquiry({ submissionKey: _submissionKey, ...inquiry }: Inquiry) {
  return inquiry
}
function toPublicInquiry(inquiry: Inquiry) {
  const {
    submissionKey: _a,
    sheetsSyncStatus: _b,
    sheetsSyncAttempts: _c,
    sheetsNextAttemptAt: _d,
    sheetsSyncedAt: _e,
    sheetsLastError: _f,
    ...publicFields
  } = inquiry
  return publicFields
}

export const inquiriesService = {
  async create(input: CreateInquiryInput) {
    // The public API accepts `budget`, but the column is named `budgetRange`
    // in the schema (kept as-is to avoid a breaking rename of stored data).
    const { budget, ...rest } = input
    const submissionKey = buildSubmissionKey(input)

    let inquiry: Inquiry
    try {
      inquiry = await prisma.inquiry.create({ data: { ...rest, budgetRange: budget, submissionKey } })
    } catch (error) {
      // The same submission arrived twice: return the original instead of
      // creating a duplicate row, sending duplicate emails or a duplicate sheet row.
      // (`submissionKey` is the only unique column set on create, so we don't
      // depend on the driver-specific shape of error.meta; we confirm by lookup.)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await prisma.inquiry.findUnique({ where: { submissionKey } })
        if (existing) {
          logger.info(`Duplicate inquiry submission ignored (existing inquiry ${existing.id})`)
          return toPublicInquiry(existing)
        }
      }
      throw error
    }

    // Awaited (not fire-and-forget): serverless hosts (Vercel) can freeze the
    // function the instant the response is sent, killing any still-pending
    // promise — an un-awaited send often never actually leaves the process.
    // sendMail() already swallows its own errors, so one bad address/provider
    // outage still can't fail the visitor's submission or block the other email.
    await Promise.allSettled([
      sendMail({
        to: input.email,
        subject: 'We received your inquiry — NOOKK STUDIO',
        html: buildClientConfirmationEmail(input),
      }),
      env.STUDIO_NOTIFICATION_EMAIL
        ? sendMail({
            to: env.STUDIO_NOTIFICATION_EMAIL,
            subject: `New inquiry from ${input.name}`,
            html: buildAdminNotificationEmail(input),
          })
        : Promise.resolve(),
    ])

    // Mirror to Google Sheets. PostgreSQL already has the inquiry, so this can
    // never fail the visitor's submission: failures are recorded on the row and
    // retried by the background worker (see inquiries.sheetsSync.ts).
    await syncNewInquiry(inquiry.id).catch(() => undefined)

    return toPublicInquiry(inquiry)
  },

  async listAll(page: number, limit: number, status?: InquiryStatus) {
    const where = status ? { status } : {}
    const [items, total] = await Promise.all([
      prisma.inquiry.findMany({ where, orderBy: { createdAt: 'desc' }, ...toSkipTake(page, limit) }),
      prisma.inquiry.count({ where }),
    ])
    return { items: items.map(toAdminInquiry), meta: toPaginationMeta(page, limit, total) }
  },

  async updateStatus(id: string, status: InquiryStatus) {
    const existing = await prisma.inquiry.findUnique({ where: { id } })
    if (!existing) throw ApiError.notFound('Inquiry not found')
    return toAdminInquiry(await prisma.inquiry.update({ where: { id }, data: { status } }))
  },
}
