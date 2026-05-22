import { Resend } from 'resend';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '../templates/emails');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.EMAIL_FROM || 'Freelance <noreply@yourdomain.com>';
const APP_URL = process.env.FRONTEND_URL || 'https://yourdomain.com';

// ── Shared Design Tokens ────────────────────────────────────────────
// All templates share the same indigo brand palette for consistency.
const T = {
    accent:     '#4F46E5',   // indigo
    accentDark: '#3730A3',
    text:       '#111827',
    muted:      '#6B7280',
    subtle:     '#9CA3AF',
    border:     '#E5E7EB',
    bg:         '#F9FAFB',
    white:      '#FFFFFF',
    green:      '#059669',
};

// ── Template Engine ────────────────────────────────────────────────

/**
 * Loads a template file and populates it with data.
 */
async function render(templateName, data = {}) {
    const filePath = path.join(TEMPLATES_DIR, `${templateName}.html`);
    let content = await fs.readFile(filePath, 'utf8');

    // Merge shared tokens into data
    const mergedData = { ...T, appUrl: APP_URL, ...data };

    // Simple placeholder replacement: {{key}}
    return content.replace(/{{(\w+)}}/g, (match, key) => {
        return mergedData[key] !== undefined ? mergedData[key] : match;
    });
}

/** Wraps any email body in a consistent shell: bg, max-width, font. */
async function shell(bodyHtml, { previewText = '' } = {}) {
    const previewTextHtml = previewText 
        ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>`
        : '';
    
    return await render('layout', {
        bodyHtml,
        previewTextHtml
    });
}

// ── Email Partials ──────────────────────────────────────────────────

const header = () => render('partials/header');
const divider = () => render('partials/divider');
const btn = (label, url, { bg = T.accent, color = T.white } = {}) => 
    render('partials/button', { label, url, bg, color });
const ghostBtn = (label, url) => render('partials/ghostButton', { label, url });
const statRow = (label, value, { last = false } = {}) => {
    const borderStyle = last ? '' : `border-bottom:1px solid ${T.border};`;
    return render('partials/statRow', { label, value, borderStyle });
};

// ── Email Functions ─────────────────────────────────────────────────

/**
 * Send a password-reset email.
 */
export async function sendPasswordResetEmail(to, resetUrl) {
    const body = await render('passwordReset', {
        header: await header(),
        ctaButton: await btn('Reset Password', resetUrl),
        divider: await divider(),
        resetUrl
    });

    const html = await shell(body, { previewText: 'Reset your Freelance password — link expires in 1 hour.' });

    const { error } = await resend.emails.send({
        from: FROM,
        to,
        subject: 'Reset your Freelance password',
        html,
    });

    if (error) {
        console.error('[emailService] sendPasswordResetEmail error:', error);
        throw new Error('Failed to send reset email');
    }
}


/**
 * Sends an invoice email with PDF link and Stripe payment link.
 */
export async function sendInvoiceEmail({ to, invoiceNumber, clientName, amount,
    currency, dueDate, pdfUrl, paymentLink }) {

    const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency', currency: currency || 'USD',
    }).format(amount);

    const dueDateFmt = dueDate
        ? new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : 'on receipt';

    const body = await render('invoice', {
        header: await header(),
        clientName,
        invoiceNumberRow: await statRow('Invoice number', `<span style="font-family:monospace;">${invoiceNumber}</span>`),
        amountDueRow: await statRow('Amount due', `<span style="color:${T.accent};font-size:16px;">${formatted}</span>`),
        dueDateRow: await statRow('Due date', dueDateFmt, { last: true }),
        paymentButton: paymentLink ? `<td style="padding-right:12px;">${await btn('Pay Now', paymentLink)}</td>` : '',
        pdfButton: pdfUrl ? `<td>${await ghostBtn('📄 Download PDF', pdfUrl)}</td>` : '',
        divider: await divider()
    });

    const html = await shell(body, {
        previewText: `Invoice ${invoiceNumber} for ${formatted} — due ${dueDateFmt}.`,
    });

    const { error } = await resend.emails.send({
        from: FROM,
        to,
        subject: `Invoice ${invoiceNumber} — ${formatted} due ${dueDateFmt}`,
        html,
    });

    if (error) {
        console.error('[emailService] sendInvoiceEmail error:', error);
        throw new Error(`Failed to send invoice email: ${error.message}`);
    }
}


/**
 * Sends a payment confirmation after successful payment.
 */
export async function sendPaymentConfirmation({ to, clientName, invoiceNumber,
    amount, currency }) {

    const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency', currency: currency || 'USD',
    }).format(amount);

    const paidAt = new Date().toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
    });

    const body = await render('paymentConfirmation', {
        header: await header(),
        formatted,
        clientName,
        invoiceRow: await statRow('Invoice', `<span style="font-family:monospace;">${invoiceNumber}</span>`),
        amountPaidRow: await statRow('Amount paid', `<strong style="color:${T.green};">${formatted}</strong>`),
        dateRow: await statRow('Date', paidAt, { last: true }),
        divider: await divider()
    });

    const html = await shell(body, {
        previewText: `Payment of ${formatted} received for invoice ${invoiceNumber}. Thank you!`,
    });

    const { error } = await resend.emails.send({
        from: FROM,
        to,
        subject: `Payment received — Invoice ${invoiceNumber}`,
        html,
    });

    if (error) {
        console.error('[emailService] sendPaymentConfirmation error:', error);
        throw new Error(`Failed to send payment confirmation: ${error.message}`);
    }
}


/**
 * Sends a weekly summary email to the freelancer.
 */
export async function sendWeeklySummary({ to, name, stats }) {
    const fmt = (n) => new Intl.NumberFormat('en-US',
        { style: 'currency', currency: 'USD' }).format(n);

    const weekRange = (() => {
        const now  = new Date();
        const mon  = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1);
        const sun  = new Date(mon); sun.setDate(mon.getDate() + 6);
        const opts = { month: 'short', day: 'numeric' };
        return `${mon.toLocaleDateString('en-US', opts)} – ${sun.toLocaleDateString('en-US', opts)}`;
    })();

    const body = await render('weeklySummary', {
        header: await header(),
        name,
        weekRange,
        earned: fmt(stats.earned),
        pendingRow: await statRow('⏳ &nbsp;Pending payments', fmt(stats.pending)),
        invoicesSentRow: await statRow('📄 &nbsp;Invoices sent', String(stats.invoicesSent)),
        topClientRow: stats.topClient ? await statRow('⭐ &nbsp;Top client', stats.topClient, { last: true }) : '',
        divider: await divider(),
        dashboardButton: await btn('Go to Dashboard', APP_URL)
    });

    const html = await shell(body, {
        previewText: `You earned ${fmt(stats.earned)} this week. ${stats.invoicesSent} invoice(s) sent.`,
    });

    const { error } = await resend.emails.send({
        from: FROM,
        to,
        subject: `Your weekly summary — ${fmt(stats.earned)} earned`,
        html,
    });

    if (error) {
        console.error('[emailService] sendWeeklySummary error:', error);
        throw new Error(`Failed to send weekly summary: ${error.message}`);
    }
}
