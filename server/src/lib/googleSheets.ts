import { auth, sheets, type sheets_v4 } from 'googleapis/build/src/apis/sheets'
import { env, googleSheetsConfig } from '../config/env'
import { logger } from './logger'

// NOTE: we import the Sheets API from its own sub-module instead of the
// `googleapis` root. The root package eagerly loads every Google API (hundreds
// of files, a large memory/startup cost on small hosts); this loads only Sheets.

export type SheetCell = string | number

export interface SheetLayout {
  headers: string[]
  /** Pixel widths, one per header. */
  columnWidths: number[]
  /** Zero-based index of the column whose text should wrap (long free text). */
  wrapColumnIndex: number
}

/** Narrow interface the sync logic depends on, so tests can swap in a fake. */
export interface SheetsGateway {
  isConfigured(): boolean
  /** Ensures the worksheet, header row and formatting exist. Idempotent and memoised. */
  prepare(): Promise<void>
  /** True when `id` already appears in column A (used to make retries duplicate-proof). */
  hasRow(id: string): Promise<boolean>
  /** Appends one row after the last used row. Never overwrites existing data. */
  appendRow(row: SheetCell[]): Promise<void>
}

/** Raised for setup problems a retry cannot fix on its own (e.g. unexpected headers). */
export class SheetsConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SheetsConfigError'
  }
}

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
const REQUEST_TIMEOUT_MS = 15_000

export interface GoogleSheetsGatewayOptions {
  layout: SheetLayout
  spreadsheetId?: string
  sheetName?: string
  /** Test hook: supply an already-authorised client instead of the service account. */
  authClient?: unknown
  /** Test hook: point the client at a local fake of the Sheets API. */
  rootUrl?: string
}

/** A1 notation requires single quotes around tab names, with embedded quotes doubled. */
const quoteTab = (name: string) => `'${name.replace(/'/g, "''")}'`

function columnLetter(index: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + index)
}

export function createGoogleSheetsGateway(options: GoogleSheetsGatewayOptions): SheetsGateway {
  const { layout } = options
  const spreadsheetId = options.spreadsheetId ?? env.GOOGLE_SHEETS_SPREADSHEET_ID
  const sheetName = options.sheetName ?? env.GOOGLE_SHEETS_SHEET_NAME
  const lastColumn = columnLetter(layout.headers.length - 1)
  const tab = quoteTab(sheetName)

  let client: sheets_v4.Sheets | null = null
  let preparing: Promise<void> | null = null

  const getClient = (): sheets_v4.Sheets => {
    if (client) return client
    const authClient =
      options.authClient ??
      new auth.GoogleAuth({
        credentials: {
          client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: env.GOOGLE_PRIVATE_KEY,
        },
        scopes: SCOPES,
      })
    client = sheets({
      version: 'v4',
      auth: authClient as never,
      ...(options.rootUrl ? { rootUrl: options.rootUrl } : {}),
    })
    return client
  }

  const requestOptions = { timeout: REQUEST_TIMEOUT_MS }

  async function doPrepare(): Promise<void> {
    const api = getClient()

    // 1. Find (or create) the worksheet.
    const meta = await api.spreadsheets.get(
      { spreadsheetId, fields: 'sheets(properties(sheetId,title))' },
      requestOptions,
    )
    let sheetId = meta.data.sheets?.find((s) => s.properties?.title === sheetName)?.properties?.sheetId ?? null
    let created = false

    if (sheetId === null) {
      logger.warn(`Google Sheets: worksheet "${sheetName}" not found — creating it`)
      const res = await api.spreadsheets.batchUpdate(
        {
          spreadsheetId,
          requestBody: { requests: [{ addSheet: { properties: { title: sheetName } } }] },
        },
        requestOptions,
      )
      sheetId = res.data.replies?.[0]?.addSheet?.properties?.sheetId ?? null
      created = true
      if (sheetId === null) throw new SheetsConfigError(`Could not create worksheet "${sheetName}"`)
    }

    // 2. Header row: write it only if row 1 is empty (or partially filled with
    //    OUR headers). If row 1 holds anything else, refuse — never overwrite data.
    const headerRes = await api.spreadsheets.values.get(
      { spreadsheetId, range: `${tab}!A1:${lastColumn}1` },
      requestOptions,
    )
    const existing = (headerRes.data.values?.[0] ?? []).map((c) => String(c ?? '').trim())
    let needsHeaders = false
    for (let i = 0; i < layout.headers.length; i++) {
      const cell = existing[i] ?? ''
      if (cell === '') needsHeaders = true
      else if (cell.toLowerCase() !== layout.headers[i].toLowerCase()) {
        throw new SheetsConfigError(
          `Row 1 of worksheet "${sheetName}" already contains different data ("${cell}" in column ${columnLetter(i)}). ` +
            'Refusing to overwrite it — point GOOGLE_SHEETS_SHEET_NAME at an empty worksheet or fix the headers.',
        )
      }
    }

    if (needsHeaders) {
      await api.spreadsheets.values.update(
        {
          spreadsheetId,
          range: `${tab}!A1:${lastColumn}1`,
          valueInputOption: 'RAW',
          requestBody: { values: [layout.headers] },
        },
        requestOptions,
      )
    }

    // 3. Formatting — applied once, when we first set the sheet up, so we don't
    //    keep overriding tweaks the studio makes by hand later.
    if (needsHeaders || created) {
      const colCount = layout.headers.length
      const requests: sheets_v4.Schema$Request[] = [
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: 'gridProperties.frozenRowCount',
          },
        },
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: colCount },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
                backgroundColor: { red: 0.95, green: 0.93, blue: 0.9 },
                verticalAlignment: 'MIDDLE',
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor,verticalAlignment)',
          },
        },
        // Data rows: top-aligned so a tall wrapped Message doesn't push other cells to the bottom.
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: colCount },
            cell: { userEnteredFormat: { verticalAlignment: 'TOP' } },
            fields: 'userEnteredFormat.verticalAlignment',
          },
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 1,
              startColumnIndex: layout.wrapColumnIndex,
              endColumnIndex: layout.wrapColumnIndex + 1,
            },
            cell: { userEnteredFormat: { wrapStrategy: 'WRAP' } },
            fields: 'userEnteredFormat.wrapStrategy',
          },
        },
        ...layout.columnWidths.map(
          (pixelSize, i): sheets_v4.Schema$Request => ({
            updateDimensionProperties: {
              range: { sheetId, dimension: 'COLUMNS', startIndex: i, endIndex: i + 1 },
              properties: { pixelSize },
              fields: 'pixelSize',
            },
          }),
        ),
      ]
      await api.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } }, requestOptions)
    }
  }

  return {
    isConfigured: () => options.authClient !== undefined || googleSheetsConfig.configured,

    prepare() {
      // Memoised so the setup calls run once per process; cleared on failure
      // (and by the other methods) so a later attempt re-checks the sheet.
      if (!preparing) {
        preparing = doPrepare().catch((error) => {
          preparing = null
          throw error
        })
      }
      return preparing
    },

    async hasRow(id) {
      try {
        const res = await getClient().spreadsheets.values.get(
          { spreadsheetId, range: `${tab}!A:A` },
          requestOptions,
        )
        return (res.data.values ?? []).some((row) => String(row?.[0] ?? '') === id)
      } catch (error) {
        preparing = null
        throw error
      }
    },

    async appendRow(row) {
      try {
        await getClient().spreadsheets.values.append(
          {
            spreadsheetId,
            range: `${tab}!A:${lastColumn}`,
            // RAW: values are stored as typed and never parsed as formulas.
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: [row] },
          },
          requestOptions,
        )
      } catch (error) {
        preparing = null
        throw error
      }
    },
  }
}

/**
 * Reduces a Google/gaxios error to a short, secret-free string for storage and logs.
 * (Raw errors can contain request config; we never persist or return those.)
 */
export function describeGoogleError(error: unknown): { status?: number; summary: string; hint?: string } {
  const e = error as { code?: number | string; status?: number; response?: { status?: number }; message?: string }
  const rawStatus = e?.response?.status ?? e?.status ?? (typeof e?.code === 'number' ? e.code : Number(e?.code))
  const status = Number.isFinite(rawStatus) ? (rawStatus as number) : undefined
  const message = (e?.message ?? 'Unknown error').replace(/\s+/g, ' ').slice(0, 300)

  let hint: string | undefined
  if (error instanceof SheetsConfigError) hint = 'Fix the worksheet contents or GOOGLE_SHEETS_SHEET_NAME.'
  else if (status === 403) hint = 'Share the spreadsheet with the service account email as an Editor, and enable the Google Sheets API.'
  else if (status === 404) hint = 'Spreadsheet not found — check GOOGLE_SHEETS_SPREADSHEET_ID and that the sheet is shared with the service account.'
  else if (status === 401 || /invalid_grant|invalid_client|DECODER|PEM|private key/i.test(message))
    hint = 'Service-account credentials look invalid — recheck GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY.'
  else if (status === 429) hint = 'Google Sheets API quota hit — will retry with backoff.'

  return { status, summary: `${status ? `${status}: ` : ''}${message}`, hint }
}
