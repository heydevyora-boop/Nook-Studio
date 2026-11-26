import type { Inquiry } from '@prisma/client'
import type { SheetCell, SheetLayout } from '../../lib/googleSheets'

/** Column order is part of the contract with the studio's spreadsheet (A–J). */
export const INQUIRY_SHEET_LAYOUT: SheetLayout = {
  headers: [
    'Submission ID',
    'Submission Date',
    'Full Name',
    'Email',
    'Phone',
    'Project Type',
    'Area (Sq. Ft.)',
    'Investment / Budget',
    'Message',
    'Inquiry Status',
  ],
  columnWidths: [210, 175, 160, 230, 140, 150, 110, 170, 440, 120],
  wrapColumnIndex: 8, // Message
}

// Google Sheets rejects cells over 50,000 characters, which would make a very
// long message fail forever. Truncate (visibly) instead.
const MAX_CELL_LENGTH = 49_000
const TRUNCATION_NOTE = ' … [truncated — full text in admin dashboard]'

// "+91 98765 43210", "(022) 1234-5678": digits and phone punctuation only, so
// no function names or cell references can hide in them.
const PHONE_LIKE = /^\+?[\d\s().-]{5,30}$/

/**
 * Neutralises spreadsheet formula injection. A cell that begins with = + - @
 * (optionally after whitespace) can be executed as a formula when the sheet is
 * exported to CSV/Excel, so we prefix it with an apostrophe, which makes every
 * spreadsheet app treat it as literal text. Genuine phone numbers (leading "+")
 * are left alone because they cannot contain a formula.
 */
export function sanitizeCell(value: string | null | undefined, opts: { phone?: boolean } = {}): string {
  if (value === null || value === undefined) return ''
  // Strip control characters except tab/newline (kept for multi-line messages).
  // eslint-disable-next-line no-control-regex
  let text = String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  if (text.length > MAX_CELL_LENGTH) text = text.slice(0, MAX_CELL_LENGTH - TRUNCATION_NOTE.length) + TRUNCATION_NOTE
  if (opts.phone && PHONE_LIKE.test(text.trim())) return text.trim()
  if (/^\s*[=+\-@]/.test(text)) return `'${text}`
  return text
}

/** e.g. "24 Nov 2026, 06:40 PM IST" — readable, and always India time. */
export function formatSubmissionDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('day')} ${get('month')} ${get('year')}, ${get('hour')}:${get('minute')} ${get('dayPeriod').toUpperCase()} IST`
}

type InquiryRowSource = Pick<
  Inquiry,
  'id' | 'createdAt' | 'name' | 'email' | 'phone' | 'projectType' | 'areaSqFt' | 'budgetRange' | 'message' | 'status'
>

/** Builds the A–J row. Optional fields become empty cells, never errors. */
export function buildInquiryRow(inquiry: InquiryRowSource): SheetCell[] {
  return [
    inquiry.id,
    formatSubmissionDate(inquiry.createdAt),
    sanitizeCell(inquiry.name.trim()),
    sanitizeCell(inquiry.email.trim()),
    sanitizeCell(inquiry.phone, { phone: true }),
    sanitizeCell(inquiry.projectType),
    inquiry.areaSqFt ?? '',
    sanitizeCell(inquiry.budgetRange),
    sanitizeCell(inquiry.message),
    inquiry.status, // NEW for fresh submissions
  ]
}
