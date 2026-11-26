import { prisma } from '../../lib/prisma'
import { logger } from '../../lib/logger'
import { googleSheetsConfig } from '../../config/env'
import { createGoogleSheetsGateway, describeGoogleError, type SheetsGateway } from '../../lib/googleSheets'
import { buildInquiryRow, INQUIRY_SHEET_LAYOUT } from './inquiries.sheets'

/**
 * Mirrors inquiries into Google Sheets. PostgreSQL is always the source of
 * truth; this module only ever *reads* inquiries and records sync progress.
 *
 * Reliability model:
 *  - Every inquiry starts PENDING. A sync attempt "claims" the row with a short
 *    lease (sheetsNextAttemptAt in the future), so two attempts / two server
 *    instances never work on the same inquiry at once.
 *  - Before appending, the sheet is checked for the inquiry's ID. If the row is
 *    already there (e.g. a previous append succeeded but the response was lost),
 *    it is marked SYNCED without appending again -> retries cannot duplicate rows.
 *  - Failures are recorded (attempts, sanitised error) and retried with backoff
 *    by a background worker; after MAX_ATTEMPTS the row is FAILED and is
 *    re-queued automatically the next time the server boots (e.g. after the
 *    credentials are fixed and the service restarts).
 */

export const MAX_ATTEMPTS = 10
const BACKOFF_MINUTES = [1, 2, 5, 10, 20, 30, 60, 60, 60, 60]
const LEASE_MS = 2 * 60 * 1000
const TICK_MS = 60 * 1000
const BATCH_SIZE = 20
/** How long the visitor's request may wait for the first attempt before responding anyway. */
const INLINE_WAIT_MS = 4000

let gateway: SheetsGateway | null = null
function getGateway(): SheetsGateway {
  gateway ??= createGoogleSheetsGateway({ layout: INQUIRY_SHEET_LAYOUT })
  return gateway
}

/** Test hook. Pass null to restore the real Google gateway. */
export function setSheetsGatewayForTesting(fake: SheetsGateway | null): void {
  gateway = fake
}

// Sheet writes are serialised within a process: keeps rows in submission order
// and stays well under Google's per-minute request quota.
let queue: Promise<unknown> = Promise.resolve()
function runExclusive<T>(task: () => Promise<T>): Promise<T> {
  const result = queue.then(task, task)
  queue = result.catch(() => undefined)
  return result
}

export type SyncOutcome = 'synced' | 'failed' | 'skipped'

const backoffMs = (attempts: number) =>
  BACKOFF_MINUTES[Math.min(attempts, BACKOFF_MINUTES.length) - 1] * 60 * 1000

async function claim(id: string): Promise<boolean> {
  const now = new Date()
  const { count } = await prisma.inquiry.updateMany({
    where: {
      id,
      sheetsSyncStatus: 'PENDING',
      OR: [{ sheetsNextAttemptAt: null }, { sheetsNextAttemptAt: { lte: now } }],
    },
    data: { sheetsNextAttemptAt: new Date(now.getTime() + LEASE_MS) },
  })
  return count === 1
}

/** Attempts to mirror one inquiry. Never throws. */
export async function attemptSync(id: string): Promise<SyncOutcome> {
  try {
    const sheets = getGateway()
    if (!sheets.isConfigured()) return 'skipped'
    if (!(await claim(id))) return 'skipped' // already synced, in flight elsewhere, or backing off

    const inquiry = await prisma.inquiry.findUnique({ where: { id } })
    if (!inquiry) return 'skipped'

    try {
      await runExclusive(async () => {
        await sheets.prepare()
        // Duplicate guard: only append if this inquiry isn't already in the sheet.
        if (!(await sheets.hasRow(inquiry.id))) {
          await sheets.appendRow(buildInquiryRow(inquiry))
        }
      })
    } catch (error) {
      const attempts = inquiry.sheetsSyncAttempts + 1
      const { summary, hint } = describeGoogleError(error)
      const exhausted = attempts >= MAX_ATTEMPTS
      await prisma.inquiry.update({
        where: { id },
        data: {
          sheetsSyncAttempts: attempts,
          sheetsLastError: summary,
          sheetsSyncStatus: exhausted ? 'FAILED' : 'PENDING',
          sheetsNextAttemptAt: exhausted ? null : new Date(Date.now() + backoffMs(attempts)),
        },
      })
      logger.warn(
        `Google Sheets sync failed for inquiry ${id} (attempt ${attempts}/${MAX_ATTEMPTS}${exhausted ? ', giving up until next restart' : ''}): ${summary}`,
        hint ? { hint } : undefined,
      )
      return 'failed'
    }

    // Row is confirmed in the sheet. If this DB write fails the row stays
    // PENDING and the next attempt finds it via hasRow() — still no duplicate.
    await prisma.inquiry.update({
      where: { id },
      data: {
        sheetsSyncStatus: 'SYNCED',
        sheetsSyncAttempts: { increment: 1 },
        sheetsSyncedAt: new Date(),
        sheetsLastError: null,
        sheetsNextAttemptAt: null,
      },
    })
    return 'synced'
  } catch (error) {
    logger.error(`Unexpected error while syncing inquiry ${id} to Google Sheets`, describeGoogleError(error).summary)
    return 'failed'
  }
}

/**
 * First attempt for a brand-new inquiry. Waits briefly so the common case
 * completes before the response (important on serverless hosts that freeze the
 * process after responding), but never delays the visitor beyond INLINE_WAIT_MS.
 * If it takes longer it simply carries on in the background.
 */
export async function syncNewInquiry(id: string): Promise<void> {
  const attempt = attemptSync(id)
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, INLINE_WAIT_MS)
  })
  await Promise.race([attempt, timeout])
  clearTimeout(timer)
}

/** One worker pass: retries due PENDING inquiries, oldest first. Returns how many synced. */
export async function runPendingSync(limit = BATCH_SIZE): Promise<{ synced: number; failed: number }> {
  const result = { synced: 0, failed: 0 }
  if (!getGateway().isConfigured()) return result

  const due = await prisma.inquiry.findMany({
    where: {
      sheetsSyncStatus: 'PENDING',
      OR: [{ sheetsNextAttemptAt: null }, { sheetsNextAttemptAt: { lte: new Date() } }],
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
    take: limit,
  })

  for (const { id } of due) {
    const outcome = await attemptSync(id)
    if (outcome === 'synced') result.synced++
    if (outcome === 'failed') {
      result.failed++
      // Likely a systemic problem (auth, quota, outage): stop here rather than
      // burning an attempt on every queued inquiry. The next tick tries again.
      break
    }
  }
  return result
}

/** Moves FAILED inquiries back to PENDING so they are retried. Returns how many. */
export async function requeueFailedSyncs(): Promise<number> {
  const { count } = await prisma.inquiry.updateMany({
    where: { sheetsSyncStatus: 'FAILED' },
    data: { sheetsSyncStatus: 'PENDING', sheetsSyncAttempts: 0, sheetsNextAttemptAt: null },
  })
  return count
}

export async function getSyncSummary() {
  const rows = await prisma.inquiry.groupBy({ by: ['sheetsSyncStatus'], _count: { _all: true } })
  const summary = { PENDING: 0, SYNCED: 0, FAILED: 0 }
  for (const row of rows) summary[row.sheetsSyncStatus] = row._count._all
  return summary
}

/** Starts the background retry loop. Returns a function that stops it. */
export function startSheetsSyncWorker(): () => void {
  if (googleSheetsConfig.partiallyConfigured) {
    logger.warn(
      `Google Sheets sync DISABLED — incomplete configuration, missing: ${googleSheetsConfig.missing.join(', ')}`,
    )
  }
  if (!getGateway().isConfigured()) {
    logger.info('Google Sheets sync is not configured — inquiries are saved to PostgreSQL only')
    return () => undefined
  }

  logger.info('Google Sheets sync enabled — retry worker started')
  let running = false
  const tick = async () => {
    if (running) return
    running = true
    try {
      const { synced, failed } = await runPendingSync()
      if (synced || failed) logger.info(`Google Sheets sync pass: ${synced} synced, ${failed} failed`)
    } catch (error) {
      logger.error('Google Sheets sync pass crashed', describeGoogleError(error).summary)
    } finally {
      running = false
    }
  }

  // Boot: give FAILED rows a fresh start (the usual fix — new credentials —
  // requires a restart), then do a first pass shortly after startup.
  void requeueFailedSyncs()
    .then((count) => count && logger.info(`Re-queued ${count} previously failed inquiry sync(s)`))
    .catch((error) => logger.error('Could not re-queue failed syncs', describeGoogleError(error).summary))
  const first = setTimeout(() => void tick(), 5_000)
  const interval = setInterval(() => void tick(), TICK_MS)
  first.unref()
  interval.unref()

  return () => {
    clearTimeout(first)
    clearInterval(interval)
  }
}
