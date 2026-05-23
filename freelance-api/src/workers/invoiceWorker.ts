// src/workers/invoiceWorker.ts
import { Worker, Queue, Job } from 'bullmq';
import redis from '../config/redis.js';
import { query } from '../config/database.js';
import { generateInvoicePdf, uploadToStorage } from '../services/pdfService.js';
import { createPaymentLink } from '../services/stripeService.js';
import { sendInvoiceEmail, sendPaymentConfirmation } from '../services/emailService.js';
import logger from '../utils/logger.js';
import { Invoice } from '../types/index.js';

interface InvoiceJobData {
    invoiceId: string;
}

// ── Queue export — imported by the /invoices/:id/send route ──────────────────
export const invoiceQueue = new Queue('invoices', { connection: redis });

// ── Worker ───────────────────────────────────────────────────────────────────
const worker = new Worker('invoices', async (job: Job<InvoiceJobData>) => {
    const { invoiceId } = job.data;
    logger.info(`[invoiceWorker] Starting job ${job.id} for invoice ${invoiceId}`);

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

    const invoice = rows[0] as Invoice;
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);
    if (!invoice.client_email) throw new Error(`Invoice ${invoiceId} has no client email`);

    await job.updateProgress(10);

    // 2. Generate PDF
    logger.info(`[invoiceWorker] Job ${job.id}: Generating PDF...`);
    const pdfBuffer = await generateInvoicePdf(invoice);
    await job.updateProgress(40);

    // 3. Upload PDF to R2 / S3
    let pdfUrl: string | null = null;
    try {
        logger.info(`[invoiceWorker] Job ${job.id}: Uploading to storage...`);
        const filename = `invoices/${invoice.user_id}/${invoice.invoice_number}.pdf`;
        pdfUrl = await uploadToStorage(pdfBuffer, filename);
    } catch (err: any) {
        logger.warn(`[invoiceWorker] Job ${job.id}: Storage upload failed, continuing without PDF link`, err.message);
    }
    await job.updateProgress(60);

    // 4. Create Stripe payment link
    let paymentLink: string | null = null;
    try {
        logger.info(`[invoiceWorker] Job ${job.id}: Creating Stripe link...`);
        paymentLink = await createPaymentLink(invoice);
    } catch (err: any) {
        logger.warn(`[invoiceWorker] Job ${job.id}: Stripe link creation failed, continuing without payment link`, err.message);
    }
    await job.updateProgress(75);

    // 5. Persist back to DB
    await query(
        `UPDATE invoices
     SET pdf_url = $1, stripe_payment_link = $2
     WHERE id = $3`,
        [pdfUrl, paymentLink, invoiceId]
    );
    await job.updateProgress(85);

    // Format the date for the email
    const displayDate = invoice.due_date 
        ? new Date(invoice.due_date).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })
        : 'on receipt';

    // 6. Send invoice email to client
    logger.info(`[invoiceWorker] Job ${job.id}: Sending email via Resend to ${invoice.client_email}...`);
    await sendInvoiceEmail({
        to: invoice.client_email,
        invoiceNumber: invoice.invoice_number,
        clientName: invoice.client_name ?? 'there',
        amount: parseFloat(invoice.total_amount as any),
        currency: invoice.currency,
        dueDate: displayDate,
        pdfUrl,
        paymentLink,
    });
    logger.info(`[invoiceWorker] Job ${job.id}: Success!`);
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

const confirmationWorker = new Worker('confirmations', async (job: Job<InvoiceJobData>) => {
    const { invoiceId } = job.data;

    const { rows } = await query(
        `SELECT i.invoice_number, i.total_amount, i.currency,
            c.name AS client_name, c.email AS client_email
     FROM invoices i
     LEFT JOIN clients c ON c.id = i.client_id
     WHERE i.id = $1`,
        [invoiceId]
    );

    const invoice = rows[0] as Invoice;
    if (!invoice?.client_email) return; // no email on file — skip silently

    await sendPaymentConfirmation({
        to: invoice.client_email,
        clientName: invoice.client_name ?? 'there',
        invoiceNumber: invoice.invoice_number,
        amount: parseFloat(invoice.total_amount as any),
        currency: invoice.currency,
    });
}, { connection: redis });

// ── Error logging ─────────────────────────────────────────────────────────────
worker.on('failed', (job, err) => {
    logger.error(`[invoiceWorker] job ${job?.id} failed`, err.message);
});
confirmationWorker.on('failed', (job, err) => {
    logger.error(`[confirmationWorker] job ${job?.id} failed`, err.message);
});

logger.info('Invoice worker running');
