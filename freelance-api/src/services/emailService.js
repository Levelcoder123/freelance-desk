// src/services/emailService.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'Freelance Desk <noreply@yourdomain.com>';

/**
 * Send a password-reset email.
 * @param {string} to - Recipient email address
 * @param {string} resetUrl - Full reset URL including token
 */
export async function sendPasswordResetEmail(to, resetUrl) {
    const { error } = await resend.emails.send({
        from: FROM,
        to,
        subject: 'Reset your Freelance Desk password',
        html: `
      <p>Hi,</p>
      <p>We received a request to reset your password.
         Click the link below. It expires in <strong>1 hour</strong>.</p>
      <p>
        <a href="${resetUrl}" style="
          display:inline-block;padding:12px 24px;background:#6366f1;
          color:#fff;text-decoration:none;border-radius:6px;font-weight:600
        ">Reset Password</a>
      </p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <p style="color:#888;font-size:12px">
        Or copy this URL into your browser:<br>${resetUrl}
      </p>
    `,
    });

    if (error) {
        console.error('[emailService] Resend error:', error);
        throw new Error('Failed to send reset email');
    }
}

/**
 * Sends an invoice email to the client with a PDF link and Stripe payment link.
 * @param {{ to: string, invoiceNumber: string, clientName: string, amount: number,
 *           currency: string, dueDate: string, pdfUrl: string, paymentLink: string }} opts
 */
export async function sendInvoiceEmail({ to, invoiceNumber, clientName, amount,
    currency, dueDate, pdfUrl, paymentLink }) {
    const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD'
    }).format(amount);

    await resend.emails.send({
        from: FROM,
        to,
        subject: `Invoice ${invoiceNumber} — ${formatted} due ${dueDate ?? 'on receipt'}`,
        html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
        <h2 style="margin-bottom:4px">Invoice ${invoiceNumber}</h2>
        <p>Hi ${clientName},</p>
        <p>Please find your invoice for <strong>${formatted}</strong>
           ${dueDate ? `due on <strong>${dueDate}</strong>` : 'due on receipt'}.</p>
        <div style="margin:24px 0;display:flex;gap:12px">
          ${pdfUrl ? `<a href="${pdfUrl}" style="padding:10px 20px;background:#f4f4f4;
            border-radius:6px;text-decoration:none;color:#333;font-size:14px">
            📄 Download PDF</a>` : ''}
          ${paymentLink ? `<a href="${paymentLink}" style="padding:10px 20px;
            background:#4f46e5;border-radius:6px;text-decoration:none;
            color:#fff;font-size:14px">💳 Pay Now</a>` : ''}
        </div>
        <p style="color:#666;font-size:13px">
          If you have any questions, please reply to this email.
        </p>
      </div>`,
    });
}

/**
 * Sends a payment confirmation to the client after successful payment.
 * @param {{ to: string, clientName: string, invoiceNumber: string,
 *           amount: number, currency: string }} opts
 */
export async function sendPaymentConfirmation({ to, clientName, invoiceNumber,
    amount, currency }) {
    const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD'
    }).format(amount);

    await resend.emails.send({
        from: FROM,
        to,
        subject: `Payment received — Invoice ${invoiceNumber}`,
        html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
        <h2>✅ Payment Received</h2>
        <p>Hi ${clientName},</p>
        <p>We've received your payment of <strong>${formatted}</strong>
           for invoice <strong>${invoiceNumber}</strong>. Thank you!</p>
        <p style="color:#666;font-size:13px">Keep this email as your receipt.</p>
      </div>`,
    });
}

/**
 * Sends a weekly summary email to the freelancer.
 * @param {{ to: string, name: string, stats: { earned: number, pending: number,
 *           invoicesSent: number, topClient: string } }} opts
 */
export async function sendWeeklySummary({ to, name, stats }) {
    const fmt = (n) => new Intl.NumberFormat('en-US',
        { style: 'currency', currency: 'USD' }).format(n);

    await resend.emails.send({
        from: FROM,
        to,
        subject: `Your weekly freelance summary`,
        html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
        <h2>Weekly Summary</h2>
        <p>Hi ${name}, here's how your week looked:</p>
        <table style="width:100%;border-collapse:collapse;font-size:15px">
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee">💰 Earned this week</td>
              <td style="text-align:right;font-weight:bold">${fmt(stats.earned)}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee">⏳ Pending</td>
              <td style="text-align:right">${fmt(stats.pending)}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee">📄 Invoices sent</td>
              <td style="text-align:right">${stats.invoicesSent}</td></tr>
          ${stats.topClient ? `<tr><td style="padding:8px 0">⭐ Top client</td>
              <td style="text-align:right">${stats.topClient}</td></tr>` : ''}
        </table>
        <p style="margin-top:20px;color:#666;font-size:13px">
          View full details in your <a href="${process.env.FRONTEND_URL}">dashboard</a>.
        </p>
      </div>`,
    });
}
