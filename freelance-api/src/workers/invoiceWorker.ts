// src/workers/invoiceWorker.ts
import { Worker, Queue, Job } from 'bullmq';
import redis from '../config/redis.js';
import { db } from '../config/database.js';
import { invoices, clients, users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { generateInvoicePdf, uploadToStorage } from '../services/pdfService.js';
import { createPaymentLink } from '../services/stripeService.js';
import { sendInvoiceEmail, sendPaymentConfirmation } from '../services/emailService.js';
import logger from '../utils/logger.js';
import { Invoice } from '../types/index.js';

interface InvoiceJobData {
    invoiceId: string;
}

// ── Queue export ─────────────────────────────────────────────────────────────
export const invoiceQueue = new Queue('invoices', { connection: redis });

// ── Worker ───────────────────────────────────────────────────────────────────
const worker = new Worker('invoices', async (job: Job<InvoiceJobData>) => {
    const { invoiceId } = job.data;
    logger.info(`[invoiceWorker] Starting job ${job.id} for invoice ${invoiceId}`);

    const result = await db.select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        userId: invoices.userId,
        currency: invoices.currency,
        amount: invoices.amount,
        taxRate: invoices.taxRate,
        taxAmount: invoices.taxAmount,
        totalAmount: invoices.totalAmount,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        lineItems: invoices.lineItems,
        notes: invoices.notes,
        client_name: clients.name,
        client_email: clients.email,
        client_address: clients.address,
        owner_name: users.fullName
    })
    .from(invoices)
    .leftJoin(clients, eq(clients.id, invoices.clientId))
    .leftJoin(users, eq(users.id, invoices.userId))
    .where(eq(invoices.id, invoiceId))
    .limit(1);

    const invoice = result[0] as any; // Cast to any for helper compatibility
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);
    if (!invoice.client_email) throw new Error(`Invoice ${invoiceId} has no client email`);

    await job.updateProgress(10);

    // 2. Generate PDF
    logger.info(`[invoiceWorker] Job ${job.id}: Generating PDF...`);
    const pdfBuffer = await generateInvoicePdf(invoice as Invoice);
    await job.updateProgress(40);

    // 3. Upload PDF to R2 / S3
    let pdfUrl: string | null = null;
    try {
        logger.info(`[invoiceWorker] Job ${job.id}: Uploading to storage...`);
        const filename = `invoices/${invoice.userId}/${invoice.invoiceNumber}.pdf`;
        pdfUrl = await uploadToStorage(pdfBuffer, filename);
    } catch (err: any) {
        logger.warn(`[invoiceWorker] Job ${job.id}: Storage upload failed, continuing without PDF link`, err.message);
    }
    await job.updateProgress(60);

    // 4. Create Stripe payment link
    let paymentLink: string | null = null;
    try {
        logger.info(`[invoiceWorker] Job ${job.id}: Creating Stripe link...`);
        paymentLink = await createPaymentLink(invoice as Invoice);
    } catch (err: any) {
        logger.warn(`[invoiceWorker] Job ${job.id}: Stripe link creation failed, continuing without payment link`, err.message);
    }
    await job.updateProgress(75);

    // 5. Persist back to DB
    await db.update(invoices)
        .set({ pdfUrl, stripePaymentLink: paymentLink })
        .where(eq(invoices.id, invoiceId));
    
    await job.updateProgress(85);

    const displayDate = invoice.dueDate 
        ? new Date(invoice.dueDate).toLocaleDateString('en-US', { 
            month: 'long', day: 'numeric', year: 'numeric' 
          })
        : 'on receipt';

    // 6. Send invoice email to client
    logger.info(`[invoiceWorker] Job ${job.id}: Sending email via Resend to ${invoice.client_email}...`);
    await sendInvoiceEmail({
        to: invoice.client_email,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.client_name ?? 'there',
        amount: parseFloat(invoice.totalAmount as any),
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
});

// ── Payment-confirmed job ─────────────────────────────────────────────────────
export const confirmationQueue = new Queue('confirmations', { connection: redis });

const confirmationWorker = new Worker('confirmations', async (job: Job<InvoiceJobData>) => {
    const { invoiceId } = job.data;

    const result = await db.select({
        invoiceNumber: invoices.invoiceNumber,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
        client_name: clients.name,
        client_email: clients.email
    })
    .from(invoices)
    .leftJoin(clients, eq(clients.id, invoices.clientId))
    .where(eq(invoices.id, invoiceId))
    .limit(1);

    const invoice = result[0];
    if (!invoice?.client_email) return;

    await sendPaymentConfirmation({
        to: invoice.client_email,
        clientName: invoice.client_name ?? 'there',
        invoiceNumber: invoice.invoiceNumber,
        amount: parseFloat(invoice.totalAmount as any),
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
