import 'server-only';
import { Resend } from 'resend';
import type { Client } from './types';
import { PLANS } from './plans';
import { getReceptionistBrand } from './brand';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'TruAutomation <notifications@truautomationtechnologies.com>';
const LOGAN_EMAIL = process.env.LOGAN_NOTIFICATION_EMAIL || 'info@truautomationtechnologies.com';

export async function sendWelcomeEmail(client: Client) {
  const plan = client.plan ? PLANS[client.plan] : null;
  const brand = getReceptionistBrand(client.industry);

  await resend.emails.send({
    from: FROM,
    to: client.email,
    subject: `Welcome to TruAutomation — your ${brand} account is live`,
    html: `
      <div style="font-family: Barlow, Arial, sans-serif; background:#0D1825; color:#fff; padding:32px;">
        <h1 style="font-family: 'Bebas Neue', sans-serif; color:#FF6B35; letter-spacing:1px;">Welcome, ${escapeHtml(client.business_name || client.contact_name || 'there')}!</h1>
        <p style="color:#8A8FA8; font-size:15px; line-height:1.6;">
          Your ${brand} AI receptionist account is now active on the <strong style="color:#fff;">${plan?.label ?? ''}</strong> plan.
        </p>
        <p style="color:#8A8FA8; font-size:15px; line-height:1.6;">
          Log in to your dashboard any time to view call logs, upcoming appointments, and update your business settings.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
           style="display:inline-block; margin-top:16px; background:#FF6B35; color:#fff; padding:14px 28px; border-radius:4px; text-decoration:none; font-weight:700;">
          Go to Dashboard
        </a>
        <p style="color:#8A8FA8; font-size:13px; margin-top:32px;">
          We'll assign your dedicated phone number shortly — you'll see it appear on your dashboard.
        </p>
      </div>
    `,
  });
}

export async function sendLoganNewClientNotification(client: Client, faqs: { question: string; answer: string }[]) {
  const plan = client.plan ? PLANS[client.plan] : null;
  const faqRows = faqs
    .map((f) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #333;">${escapeHtml(f.question)}</td><td style="padding:6px 12px;border-bottom:1px solid #333;">${escapeHtml(f.answer)}</td></tr>`)
    .join('');

  await resend.emails.send({
    from: FROM,
    to: LOGAN_EMAIL,
    subject: `New client signed up: ${client.business_name || client.email}`,
    html: `
      <div style="font-family: Barlow, Arial, sans-serif; background:#0D1825; color:#fff; padding:32px;">
        <h2 style="font-family: 'Bebas Neue', sans-serif; color:#FF6B35;">New Client — Payment Confirmed</h2>
        <table style="width:100%; border-collapse:collapse; font-size:14px;">
          <tr><td style="padding:6px 12px; color:#8A8FA8;">Business</td><td style="padding:6px 12px;">${escapeHtml(client.business_name || '')}</td></tr>
          <tr><td style="padding:6px 12px; color:#8A8FA8;">Contact</td><td style="padding:6px 12px;">${escapeHtml(client.contact_name || '')}</td></tr>
          <tr><td style="padding:6px 12px; color:#8A8FA8;">Email</td><td style="padding:6px 12px;">${escapeHtml(client.email)}</td></tr>
          <tr><td style="padding:6px 12px; color:#8A8FA8;">Phone</td><td style="padding:6px 12px;">${escapeHtml(client.phone || '')}</td></tr>
          <tr><td style="padding:6px 12px; color:#8A8FA8;">Industry</td><td style="padding:6px 12px;">${escapeHtml(client.industry || '')}</td></tr>
          <tr><td style="padding:6px 12px; color:#8A8FA8;">Address</td><td style="padding:6px 12px;">${escapeHtml(client.address || '')}</td></tr>
          <tr><td style="padding:6px 12px; color:#8A8FA8;">Plan</td><td style="padding:6px 12px;">${plan?.label ?? ''} ($${plan?.perMinute ?? ''}/min)</td></tr>
        </table>
        <h3 style="font-family: 'Bebas Neue', sans-serif; color:#FF6B35; margin-top:24px;">FAQ Entries</h3>
        <table style="width:100%; border-collapse:collapse; font-size:14px;">${faqRows || '<tr><td style="padding:6px 12px; color:#8A8FA8;">None provided</td></tr>'}</table>
        <p style="color:#8A8FA8; font-size:13px; margin-top:24px;">
          Action needed: assign a Twilio number to this client from the <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" style="color:#FF6B35;">admin dashboard</a>.
        </p>
      </div>
    `,
  });
}

export async function sendClientUpdateNotification(client: Client, changes: { field: string; oldValue: string; newValue: string }[]) {
  if (changes.length === 0) return;

  const rows = changes
    .map(
      (c) => `
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid #333;color:#8A8FA8;">${escapeHtml(c.field)}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #333;">${escapeHtml(c.oldValue) || '<em>empty</em>'}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #333;">${escapeHtml(c.newValue) || '<em>empty</em>'}</td>
        </tr>`
    )
    .join('');

  await resend.emails.send({
    from: FROM,
    to: LOGAN_EMAIL,
    subject: `Client Update — ${client.business_name || client.email}`,
    html: `
      <div style="font-family: Barlow, Arial, sans-serif; background:#0D1825; color:#fff; padding:32px;">
        <h2 style="font-family: 'Bebas Neue', sans-serif; color:#FF6B35;">Client Update — ${escapeHtml(client.business_name || client.email)}</h2>
        <p style="color:#8A8FA8; font-size:14px;">The client updated the following fields via their dashboard settings page:</p>
        <table style="width:100%; border-collapse:collapse; font-size:14px; margin-top:12px;">
          <tr>
            <th style="padding:6px 12px; text-align:left; color:#8A8FA8;">Field</th>
            <th style="padding:6px 12px; text-align:left; color:#8A8FA8;">Old Value</th>
            <th style="padding:6px 12px; text-align:left; color:#8A8FA8;">New Value</th>
          </tr>
          ${rows}
        </table>
        <p style="color:#8A8FA8; font-size:13px; margin-top:24px;">
          View full details on the <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/clients/${client.id}" style="color:#FF6B35;">admin dashboard</a>.
        </p>
      </div>
    `,
  });
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
