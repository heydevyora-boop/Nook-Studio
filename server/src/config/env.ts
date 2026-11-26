import 'dotenv/config'
import { z } from 'zod'

/**
 * Hosting dashboards store a multi-line PEM key in different ways: with real
 * newlines, with literal "\n" sequences, or wrapped in quotes. Accept all of them.
 */
function normalizePrivateKey(raw: string): string {
  let key = raw.trim()
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1)
  }
  return key.replace(/\\n/g, '\n').trim()
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean)),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  RESEND_API_KEY: z.string().optional().default(''),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().int().positive().optional().default(587),
  SMTP_SECURE: z
    .string()
    .optional()
    .default('false')
    .transform((value) => value === 'true'),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASSWORD: z.string().optional().default(''),

  MAIL_FROM: z.string().default('NOOKK STUDIO <no-reply@nookkstudio.com>'),
  STUDIO_NOTIFICATION_EMAIL: z.string().email().optional(),

  // --- Google Sheets inquiry mirror (all optional: leave unset to disable) ---
  GOOGLE_SHEETS_SPREADSHEET_ID: z.string().optional().default('').transform((v) => v.trim()),
  GOOGLE_SHEETS_SHEET_NAME: z
    .string()
    .optional()
    .default('')
    .transform((v) => v.trim() || 'Sheet1'),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional().default('').transform((v) => v.trim()),
  GOOGLE_PRIVATE_KEY: z.string().optional().default('').transform(normalizePrivateKey),

  INQUIRY_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(60),
  INQUIRY_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment configuration:')
  console.error(parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment configuration — see errors above')
}

export const env = parsed.data
export const isProduction = env.NODE_ENV === 'production'

/** Which of the required Google Sheets variables are missing (names only — never values). */
const missingGoogleSheetsVars = (
  [
    ['GOOGLE_SHEETS_SPREADSHEET_ID', env.GOOGLE_SHEETS_SPREADSHEET_ID],
    ['GOOGLE_SERVICE_ACCOUNT_EMAIL', env.GOOGLE_SERVICE_ACCOUNT_EMAIL],
    ['GOOGLE_PRIVATE_KEY', env.GOOGLE_PRIVATE_KEY],
  ] as const
)
  .filter(([, value]) => !value)
  .map(([name]) => name)

export const googleSheetsConfig = {
  /** True only when every credential needed to talk to the sheet is present. */
  configured: missingGoogleSheetsVars.length === 0,
  /** True when some, but not all, of the variables are set — almost certainly a mistake. */
  partiallyConfigured: missingGoogleSheetsVars.length > 0 && missingGoogleSheetsVars.length < 3,
  missing: missingGoogleSheetsVars as readonly string[],
}
