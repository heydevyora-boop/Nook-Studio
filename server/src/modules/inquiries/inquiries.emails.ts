import type { CreateInquiryInput } from './inquiries.schema'

const BRAND = {
  cream: '#F7F3ED',
  dark: '#261711',
  accent: '#B87247',
  muted: '#76675E',
  line: '#D9CFC4',
}

function emailShell(bodyHtml: string): string {
  return `
    <div style="background-color:${BRAND.cream};padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:520px;margin:0 auto;background-color:#ffffff;border:1px solid ${BRAND.line};">
        <div style="background-color:${BRAND.dark};padding:24px 32px;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:0.05em;color:${BRAND.cream};">
            NOOKK STUDIO
          </span>
        </div>
        <div style="padding:32px;color:${BRAND.dark};">
          ${bodyHtml}
        </div>
        <div style="padding:16px 32px;border-top:1px solid ${BRAND.line};color:${BRAND.muted};font-size:12px;">
          NOOKK STUDIO &mdash; Thoughtfully designed spaces.
        </div>
      </div>
    </div>
  `
}

function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:6px 16px 6px 0;color:${BRAND.muted};font-size:13px;text-transform:uppercase;letter-spacing:0.05em;white-space:nowrap;vertical-align:top;">
        ${label}
      </td>
      <td style="padding:6px 0;font-size:14px;vertical-align:top;">${value}</td>
    </tr>
  `
}

/** Internal notification sent to the studio's inbox when a visitor submits the form. */
export function buildAdminNotificationEmail(inquiry: CreateInquiryInput): string {
  const rows = [
    detailRow('Name', inquiry.name),
    detailRow('Email', inquiry.email),
    detailRow('Phone', inquiry.phone ?? '—'),
    detailRow('Project Type', inquiry.projectType ?? '—'),
    detailRow('Budget', inquiry.budget ?? '—'),
    detailRow('Area', inquiry.areaSqFt ? `${inquiry.areaSqFt} sq. ft.` : '—'),
  ].join('')

  return emailShell(`
    <h2 style="font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:22px;margin:0 0 20px;">
      New consultation inquiry
    </h2>
    <table style="width:100%;border-collapse:collapse;">${rows}</table>
    <p style="margin:20px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;color:${BRAND.muted};">
      Message
    </p>
    <p style="white-space:pre-wrap;font-size:14px;line-height:1.6;margin:0;">${inquiry.message}</p>
  `)
}

/** Confirmation sent to the visitor acknowledging their submission. */
export function buildClientConfirmationEmail(inquiry: CreateInquiryInput): string {
  return emailShell(`
    <h2 style="font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:24px;margin:0 0 16px;">
      Thank you, ${inquiry.name}.
    </h2>
    <p style="font-size:14px;line-height:1.7;margin:0 0 16px;">
      We've received your inquiry and a member of our studio will be in touch within
      <strong>2 business days</strong> to talk through your project.
    </p>
    <div style="background-color:${BRAND.cream};border:1px solid ${BRAND.line};padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:${BRAND.muted};">
        What you told us
      </p>
      <p style="margin:0;font-size:14px;line-height:1.7;white-space:pre-wrap;">${inquiry.message}</p>
    </div>
    <p style="font-size:14px;line-height:1.7;margin:0;color:${BRAND.muted};">
      If anything changes in the meantime, just reply to this email.
    </p>
    <p style="font-size:14px;line-height:1.7;margin:20px 0 0;">
      Warmly,<br />
      <span style="font-family:Georgia,'Times New Roman',serif;color:${BRAND.accent};">NOOKK STUDIO</span>
    </p>
  `)
}
