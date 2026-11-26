/**
 * Exercises the REAL googleapis client against a local fake of the Sheets REST
 * API, to verify the exact requests we send (no network, no credentials, no DB).
 */
import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { auth } from 'googleapis/build/src/apis/sheets'
import { createGoogleSheetsGateway, SheetsConfigError } from '../src/lib/googleSheets'
import { INQUIRY_SHEET_LAYOUT } from '../src/modules/inquiries/inquiries.sheets'

const SPREADSHEET = 'SPREADSHEET_ID_123'
type Req = { method: string; path: string; query: URLSearchParams; body: any }

// --- minimal stateful fake of the Sheets API -------------------------------
let tabs: { sheetId: number; title: string }[] = []
let cells: Record<string, string[][]> = {} // tab title -> rows
let calls: Req[] = []
let server: http.Server
let rootUrl = ''

function handle(req: http.IncomingMessage, res: http.ServerResponse, raw: string) {
  const url = new URL(req.url!, 'http://x')
  const path = decodeURIComponent(url.pathname)
  const body = raw ? JSON.parse(raw) : undefined
  calls.push({ method: req.method!, path, query: url.searchParams, body })
  const send = (code: number, obj: unknown) => {
    res.writeHead(code, { 'content-type': 'application/json' })
    res.end(JSON.stringify(obj))
  }
  const tabOf = (range: string) => range.match(/^'((?:[^']|'')+)'!/)![1].replace(/''/g, "'")

  if (req.headers.authorization !== 'Bearer test-token') return send(401, { error: { code: 401, message: 'bad auth' } })
  if (path === `/v4/spreadsheets/${SPREADSHEET}` && req.method === 'GET')
    return send(200, { sheets: tabs.map((t) => ({ properties: t })) })
  if (path === `/v4/spreadsheets/${SPREADSHEET}:batchUpdate`) {
    const replies = (body.requests as any[]).map((r) => {
      if (r.addSheet) {
        const t = { sheetId: 100 + tabs.length, title: r.addSheet.properties.title }
        tabs.push(t)
        cells[t.title] = []
        return { addSheet: { properties: t } }
      }
      return {}
    })
    return send(200, { replies })
  }
  const m = path.match(new RegExp(`^/v4/spreadsheets/${SPREADSHEET}/values/(.+?)(:append)?$`))
  if (m) {
    const range = m[1]
    const rows = (cells[tabOf(range)] ??= [])
    if (m[2]) {
      rows.push(...body.values.map((r: unknown[]) => r.map(String)))
      return send(200, { updates: { updatedRows: body.values.length } })
    }
    if (req.method === 'PUT') {
      rows[0] = body.values[0]
      return send(200, { updatedCells: body.values[0].length })
    }
    if (/!A1:J1$/.test(range)) return send(200, rows[0] ? { values: [rows[0]] } : {})
    if (/!A:A$/.test(range)) return send(200, rows.length ? { values: rows.map((r) => [r[0] ?? '']) } : {})
  }
  send(404, { error: { code: 404, message: `unhandled ${req.method} ${path}` } })
}

before(async () => {
  server = http.createServer((req, res) => {
    let raw = ''
    req.on('data', (c) => (raw += c))
    req.on('end', () => handle(req, res, raw))
  }).listen(0)
  await new Promise((r) => server.once('listening', r))
  rootUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`
})
after(() => server.close())

const reset = (initialTabs: typeof tabs = [], initialCells: typeof cells = {}) => {
  tabs = initialTabs
  cells = initialCells
  calls = []
}
function gateway(sheetName = 'Sheet1') {
  const client = new auth.OAuth2()
  client.setCredentials({ access_token: 'test-token', expiry_date: Date.now() + 3_600_000 })
  return createGoogleSheetsGateway({ layout: INQUIRY_SHEET_LAYOUT, spreadsheetId: SPREADSHEET, sheetName, authClient: client, rootUrl })
}
const writes = () => calls.filter((c) => c.method !== 'GET')

describe('Google Sheets gateway (real googleapis client, fake Google)', () => {
  it('brand-new worksheet: creates tab, writes headers A–J, applies formatting', async () => {
    reset()
    await gateway('Inquiries').prepare()

    assert.deepEqual(cells['Inquiries'][0], INQUIRY_SHEET_LAYOUT.headers)
    assert.equal(INQUIRY_SHEET_LAYOUT.headers.length, 10)
    assert.deepEqual(cells['Inquiries'][0].slice(0, 3), ['Submission ID', 'Submission Date', 'Full Name'])

    const fmt = calls.filter((c) => c.path.endsWith(':batchUpdate')).at(-1)!.body.requests as any[]
    const sid = 100
    assert.ok(fmt.some((r) => r.updateSheetProperties?.properties.gridProperties.frozenRowCount === 1 && r.updateSheetProperties.properties.sheetId === sid), 'freeze row')
    assert.ok(fmt.some((r) => r.repeatCell?.cell.userEnteredFormat.textFormat?.bold && r.repeatCell.range.endRowIndex === 1), 'bold header')
    const wrap = fmt.find((r) => r.repeatCell?.cell.userEnteredFormat.wrapStrategy === 'WRAP')
    assert.equal(wrap.repeatCell.range.startColumnIndex, 8, 'wrap applies to column I (Message)')
    assert.equal(wrap.repeatCell.range.startRowIndex, 1, 'wrap excludes header row')
    const widths = fmt.filter((r) => r.updateDimensionProperties).map((r) => r.updateDimensionProperties.properties.pixelSize)
    assert.equal(widths.length, 10)
    assert.ok(widths[8] > widths[0], 'Message column is the widest')
  })

  it('existing worksheet with our headers: no header write, no re-formatting, no data touched', async () => {
    reset([{ sheetId: 7, title: 'Sheet1' }], { Sheet1: [INQUIRY_SHEET_LAYOUT.headers, ['old-1', 'old row']] })
    await gateway().prepare()
    assert.equal(writes().length, 0)
    assert.equal(cells.Sheet1.length, 2)
  })

  it('refuses to overwrite a worksheet whose row 1 holds other data', async () => {
    reset([{ sheetId: 7, title: 'Sheet1' }], { Sheet1: [['Client', 'Notes'], ['x', 'y']] })
    await assert.rejects(gateway().prepare(), (e: unknown) => e instanceof SheetsConfigError && /Refusing to overwrite/.test((e as Error).message))
    assert.equal(writes().length, 0)
    assert.deepEqual(cells.Sheet1[0], ['Client', 'Notes'])
  })

  it('partially-filled header row (ours) is completed without clobbering', async () => {
    reset([{ sheetId: 7, title: 'Sheet1' }], { Sheet1: [['Submission ID', 'Submission Date']] })
    await gateway().prepare()
    assert.deepEqual(cells.Sheet1[0], INQUIRY_SHEET_LAYOUT.headers)
  })

  it('append: RAW + INSERT_ROWS into A:J, preserving existing rows', async () => {
    reset([{ sheetId: 7, title: 'Sheet1' }], { Sheet1: [INQUIRY_SHEET_LAYOUT.headers, ['old-1', 'keep me']] })
    const g = gateway()
    await g.prepare()
    await g.appendRow(['new-1', '24 Nov 2026, 06:40 PM IST', 'Jane', 'j@x.co', '', '', '', '', "'=evil", 'NEW'])
    const append = calls.find((c) => c.path.endsWith(':append'))!
    assert.equal(append.query.get('valueInputOption'), 'RAW')
    assert.equal(append.query.get('insertDataOption'), 'INSERT_ROWS')
    assert.match(append.path, /'Sheet1'!A:J:append$/)
    assert.equal(cells.Sheet1.length, 3)
    assert.deepEqual(cells.Sheet1[1], ['old-1', 'keep me']) // untouched
    assert.equal(cells.Sheet1[2][0], 'new-1')
  })

  it('hasRow finds an ID in column A, and not others', async () => {
    reset([{ sheetId: 7, title: 'Sheet1' }], { Sheet1: [INQUIRY_SHEET_LAYOUT.headers, ['abc123']] })
    const g = gateway()
    assert.equal(await g.hasRow('abc123'), true)
    assert.equal(await g.hasRow('abc12'), false)
    assert.equal(await g.hasRow('zzz'), false)
  })

  it("worksheet names with spaces/apostrophes are quoted correctly", async () => {
    reset([{ sheetId: 9, title: "Nookk's Leads" }], { "Nookk's Leads": [INQUIRY_SHEET_LAYOUT.headers] })
    const g = gateway("Nookk's Leads")
    await g.prepare()
    await g.appendRow(['id-1'])
    assert.equal(cells["Nookk's Leads"].length, 2)
  })

  it('Google errors surface with an HTTP status (so they can be classified, not leaked)', async () => {
    reset()
    const client = new auth.OAuth2()
    client.setCredentials({ access_token: 'WRONG', expiry_date: Date.now() + 3_600_000 })
    const g = createGoogleSheetsGateway({ layout: INQUIRY_SHEET_LAYOUT, spreadsheetId: SPREADSHEET, sheetName: 'Sheet1', authClient: client, rootUrl })
    await assert.rejects(g.prepare(), (e: any) => e.code === 401 || e.status === 401 || e.response?.status === 401)
  })
})
