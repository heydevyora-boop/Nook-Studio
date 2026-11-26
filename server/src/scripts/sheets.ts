/**
 * Operator tool for the Google Sheets inquiry mirror.
 *
 *   npm run sheets:setup   Verifies credentials + access, creates the worksheet
 *                          and header row if needed, applies formatting.
 *   npm run sheets:sync    Re-queues FAILED inquiries and pushes everything
 *                          pending to the sheet right now.
 *   npm run sheets:status  Shows how many inquiries are PENDING / SYNCED / FAILED.
 *
 * In production use the compiled build:  node dist/scripts/sheets.js setup
 */
import { googleSheetsConfig } from '../config/env'
import { prisma } from '../lib/prisma'
import { createGoogleSheetsGateway, describeGoogleError } from '../lib/googleSheets'
import { INQUIRY_SHEET_LAYOUT } from '../modules/inquiries/inquiries.sheets'
import { getSyncSummary, requeueFailedSyncs, runPendingSync } from '../modules/inquiries/inquiries.sheetsSync'

async function main() {
  const command = process.argv[2]

  if (!['setup', 'sync', 'status'].includes(command ?? '')) {
    console.log('Usage: sheets <setup|sync|status>')
    process.exitCode = 1
    return
  }

  if (command === 'status') {
    console.log('Configured:', googleSheetsConfig.configured ? 'yes' : `no (missing: ${googleSheetsConfig.missing.join(', ')})`)
    console.log('Inquiry sync status:', await getSyncSummary())
    return
  }

  if (!googleSheetsConfig.configured) {
    console.error(`Google Sheets is not configured. Missing: ${googleSheetsConfig.missing.join(', ')}`)
    process.exitCode = 1
    return
  }

  if (command === 'setup') {
    try {
      await createGoogleSheetsGateway({ layout: INQUIRY_SHEET_LAYOUT }).prepare()
      console.log('OK — spreadsheet reachable, worksheet and header row are ready.')
    } catch (error) {
      const { summary, hint } = describeGoogleError(error)
      console.error(`Setup failed: ${summary}`)
      if (hint) console.error(`Hint: ${hint}`)
      process.exitCode = 1
    }
    return
  }

  // command === 'sync'
  const requeued = await requeueFailedSyncs()
  if (requeued) console.log(`Re-queued ${requeued} failed inquiry sync(s).`)
  let total = 0
  for (;;) {
    const { synced, failed } = await runPendingSync(50)
    total += synced
    if (failed) {
      console.error(`A sync failed after ${total} inquiries — run "status" and check the server logs / sheetsLastError.`)
      process.exitCode = 1
      break
    }
    if (synced === 0) break
  }
  console.log(`Done. ${total} inquiry(ies) written to the sheet.`, await getSyncSummary())
}

main()
  .catch((error) => {
    console.error('Unexpected error:', describeGoogleError(error).summary)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
