// src/workers/invoiceWorker.js
import { Worker, Queue } from 'bullmq';
import redis from '../config/redis.js';
import { query } from '../config/database.js';
import { generateInvoicePdf, uploadToStorage } from '../services/pdfService.js';
import { createPaymentLink } from '../services/stripeService.js';
import { sendInvoiceEmail, sendPaymentConfirmation } from '../services/emailService.js';

// ── Queue export — imported by the /invoices/:id/send route ──────────────────
export const invoiceQueue = new Queue('invoices', { connection: redis });

// ── Worker ───────────────────────────────────────────────────────────────────
const worker = new Worker('invoices', async (job) => {
    const { invoiceId } = job.data;

    // 1. Fetch full invoice + client details
    const { rows } = await query(
        `SELECT i.*,
            c.name    AS client_name,
            c.email   AS client_email,
            c.address AS client_address,
            u.full_name AS owner_name
     FROM invoices i
     LEFT JOIN clients c ON c.id = i.client_id
     LEFT JOIN users   u ON u.id = i.user_id
     WHERE i.id = $1`,
        [invoiceId]
    );

    const invoice = rows[0];
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);
    if (!invoice.client_email) throw new Error(`Invoice ${invoiceId} has no client email`);

    await job.updateProgress(10);

    // 2. Generate PDF
    const pdfBuffer = await generateInvoicePdf(invoice);
    await job.updateProgress(40);

    // 3. Upload PDF to R2 / S3
    const filename = `invoices/${invoice.user_id}/${invoice.invoice_number}.pdf`;
    const pdfUrl = await uploadToStorage(pdfBuffer, filename);
    await job.updateProgress(60);

    // 4. Create Stripe payment link
    const paymentLink = await createPaymentLink(invoice);
    await job.updateProgress(75);

    // 5. Persist pdf_url + stripe_payment_link back to DB
    await query(
        `UPDATE invoices
     SET pdf_url = $1, stripe_payment_link = $2
     WHERE id = $3`,
        [pdfUrl, paymentLink, invoiceId]
    );
    await job.updateProgress(85);

    // 6. Send invoice email to client
    await sendInvoiceEmail({
        to: invoice.client_email,
        invoiceNumber: invoice.invoice_number,
        clientName: invoice.client_name ?? 'there',
        amount: parseFloat(invoice.total_amount),
        currency: invoice.currency,
        dueDate: invoice.due_date,
        pdfUrl,
        paymentLink,
    });
    await job.updateProgress(100);

    return { pdfUrl, paymentLink };
}, {
    connection: redis,
    concurrency: 5,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 200 },
    },
});

// ── Payment-confirmed job ─────────────────────────────────────────────────────
// Dispatched from the Stripe webhook handler in index.js after marking paid.
export const confirmationQueue = new Queue('confirmations', { connection: redis });

const confirmationWorker = new Worker('confirmations', async (job) => {
    const { invoiceId } = job.data;

    const { rows } = await query(
        `SELECT i.invoice_number, i.total_amount, i.currency,
            c.name AS client_name, c.email AS client_email
     FROM invoices i
     LEFT JOIN clients c ON c.id = i.client_id
     WHERE i.id = $1`,
        [invoiceId]
    );

    const invoice = rows[0];
    if (!invoice?.client_email) return; // no email on file — skip silently

    await sendPaymentConfirmation({
        to: invoice.client_email,
        clientName: invoice.client_name ?? 'there',
        invoiceNumber: invoice.invoice_number,
        amount: parseFloat(invoice.total_amount),
        currency: invoice.currency,
    });
}, { connection: redis });

// ── Error logging ─────────────────────────────────────────────────────────────
worker.on('failed', (job, err) => {
    console.error(`[invoiceWorker] job ${job?.id} failed:`, err.message);
});
confirmationWorker.on('failed', (job, err) => {
    console.error(`[confirmationWorker] job ${job?.id} failed:`, err.message);
});

console.log('Invoice worker running');
