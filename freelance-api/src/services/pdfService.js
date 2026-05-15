// src/services/pdfService.js
import PDFDocument from 'pdfkit';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { fileURLToPath } from 'url';
import path from 'path';

const s3 = new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT,          // Cloudflare R2 endpoint
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
});

const BUCKET = process.env.S3_BUCKET || 'freelance-invoices';

/**
 * Generates an invoice PDF and returns it as a Buffer.
 * @param {object} invoice - Full invoice row, with client_name, client_email,
 *                           client_address, line_items (array), etc.
 * @returns {Promise<Buffer>}
 */
export function generateInvoicePdf(invoice) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const fmt = (n) => new Intl.NumberFormat('en-US',
            { style: 'currency', currency: invoice.currency || 'USD' }).format(n);
        const pageW = doc.page.width - 100; // accounting for margins

        // ── Header ───────────────────────────────────────────────────
        doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', 50, 50);
        doc.fontSize(10).font('Helvetica').fillColor('#666')
            .text(`#${invoice.invoice_number}`, 50, 82);

        // Right: amounts block
        doc.fontSize(13).font('Helvetica-Bold').fillColor('#1a1a1a')
            .text(fmt(invoice.total_amount), 400, 50, { align: 'right', width: 145 });
        doc.fontSize(9).font('Helvetica').fillColor('#666')
            .text(`(incl. ${invoice.tax_rate ?? 0}% tax)`, 400, 68, { align: 'right', width: 145 });

        doc.moveTo(50, 105).lineTo(545, 105).strokeColor('#e5e7eb').stroke();

        // ── Dates ────────────────────────────────────────────────────
        doc.fontSize(9).fillColor('#666').font('Helvetica');
        doc.text('Issue date', 50, 120);
        doc.text('Due date', 200, 120);
        doc.text('Status', 380, 120);

        doc.fontSize(10).fillColor('#1a1a1a').font('Helvetica-Bold');
        doc.text(invoice.issue_date ?? '—', 50, 134);
        doc.text(invoice.due_date ?? '—', 200, 134);
        doc.text((invoice.status ?? 'draft').toUpperCase(), 380, 134);

        // ── Bill to ──────────────────────────────────────────────────
        doc.fontSize(9).fillColor('#666').font('Helvetica').text('Bill to', 50, 170);
        doc.fontSize(11).fillColor('#1a1a1a').font('Helvetica-Bold')
            .text(invoice.client_name ?? '—', 50, 183);
        doc.fontSize(9).font('Helvetica').fillColor('#555')
            .text(invoice.client_email ?? '', 50, 197)
            .text(invoice.client_address ?? '', 50, 209, { width: 200 });

        // ── Line items table ─────────────────────────────────────────
        const tableTop = 260;
        doc.moveTo(50, tableTop - 8).lineTo(545, tableTop - 8)
            .strokeColor('#e5e7eb').stroke();

        doc.fontSize(9).fillColor('#666').font('Helvetica');
        doc.text('Description', 50, tableTop);
        doc.text('Qty', 330, tableTop, { width: 40, align: 'right' });
        doc.text('Rate', 380, tableTop, { width: 60, align: 'right' });
        doc.text('Amount', 450, tableTop, { width: 95, align: 'right' });

        doc.moveTo(50, tableTop + 14).lineTo(545, tableTop + 14)
            .strokeColor('#e5e7eb').stroke();

        let y = tableTop + 22;
        const items = Array.isArray(invoice.line_items) ? invoice.line_items : [];

        if (items.length === 0) {
            // Fallback: single line from invoice amount
            items.push({
                description: invoice.notes || 'Services rendered',
                quantity: 1,
                rate: parseFloat(invoice.amount),
                amount: parseFloat(invoice.amount),
            });
        }

        doc.font('Helvetica').fillColor('#1a1a1a').fontSize(10);
        for (const item of items) {
            doc.text(item.description, 50, y, { width: 270 });
            doc.text(String(item.quantity), 330, y, { width: 40, align: 'right' });
            doc.text(fmt(item.rate), 380, y, { width: 60, align: 'right' });
            doc.text(fmt(item.amount), 450, y, { width: 95, align: 'right' });
            y += 20;
        }

        // ── Totals ───────────────────────────────────────────────────
        y += 10;
        doc.moveTo(350, y).lineTo(545, y).strokeColor('#e5e7eb').stroke();
        y += 12;

        const totalsLeft = 350;
        const totalsRight = { width: 145, align: 'right' };

        doc.fontSize(10).fillColor('#555').font('Helvetica');
        doc.text('Subtotal', totalsLeft, y);
        doc.text(fmt(invoice.amount), 400, y, totalsRight);
        y += 18;

        if (parseFloat(invoice.tax_rate) > 0) {
            doc.text(`Tax (${invoice.tax_rate}%)`, totalsLeft, y);
            doc.text(fmt(invoice.tax_amount), 400, y, totalsRight);
            y += 18;
        }

        doc.moveTo(350, y).lineTo(545, y).strokeColor('#1a1a1a').lineWidth(1).stroke();
        y += 10;

        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a');
        doc.text('Total', totalsLeft, y);
        doc.text(fmt(invoice.total_amount), 400, y, totalsRight);

        // ── Notes ────────────────────────────────────────────────────
        if (invoice.notes) {
            y += 50;
            doc.fontSize(9).fillColor('#666').font('Helvetica').text('Notes', 50, y);
            doc.fontSize(10).fillColor('#333').text(invoice.notes, 50, y + 14, { width: 400 });
        }

        // ── Footer ───────────────────────────────────────────────────
        doc.fontSize(8).fillColor('#aaa')
            .text('Generated by freelance. — your all-in-one dashboard',
                50, doc.page.height - 40, { align: 'center', width: pageW });

        doc.end();
    });
}

/**
 * Uploads a Buffer to Cloudflare R2 (or AWS S3) and returns the public URL.
 * @param {Buffer} buffer
 * @param {string} filename  e.g. "invoices/inv-2024-001.pdf"
 * @returns {Promise<string>} public URL
 */
export async function uploadToStorage(buffer, filename) {
    await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: filename,
        Body: buffer,
        ContentType: 'application/pdf',
        // R2 public buckets expose files at the custom domain set in the dashboard.
        // If using private bucket, generate a presigned URL instead.
    }));

    // Construct public URL — set R2_PUBLIC_URL in .env if using a custom domain
    const base = process.env.R2_PUBLIC_URL
        || `${process.env.S3_ENDPOINT}/${BUCKET}`;
    return `${base}/${filename}`;
}