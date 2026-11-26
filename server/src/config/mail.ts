import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import { env } from './env'
import { logger } from '../lib/logger'

interface SendMailInput {
  to: string
  subject: string
  html: string
}

const resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

const smtpTransport =
  !resendClient && env.SMTP_HOST
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
      })
    : null

/**
 * Sends an email via Resend when configured, falling back to SMTP/Nodemailer.
 * If neither is configured, the message is logged instead of throwing —
 * failing to notify the studio should never fail the inquiry submission itself.
 */
export async function sendMail({ to, subject, html }: SendMailInput): Promise<void> {
  try {
    if (resendClient) {
      await resendClient.emails.send({ from: env.MAIL_FROM, to, subject, html })
      return
    }

    if (smtpTransport) {
      await smtpTransport.sendMail({ from: env.MAIL_FROM, to, subject, html })
      return
    }

    logger.warn('No email provider configured (RESEND_API_KEY / SMTP_*) — email not sent', {
      to,
      subject,
    })
  } catch (error) {
    logger.error('Failed to send email', { to, subject, error })
  }
}
