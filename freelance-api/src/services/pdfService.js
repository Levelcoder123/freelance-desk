// src/services/pdfService.js
import PDFDocument from 'pdfkit';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
});

const BUCKET = process.env.S3_BUCKET || 'freelance-invoices';

// ── Design Tokens ───────────────────────────────────────────────────
const STYLES = {
    colors: {
        accent:       '#4F46E5',   // indigo
        accentLight:  '#EEF2FF',
        text:         '#111827',
        muted:        '#6B7280',
        subtle:       '#9CA3AF',
        divider:      '#E5E7EB',
        rowAlt:       '#F9FAFB',
        white:        '#FFFFFF',
        status: {
            PAID:      '#059669',
            OVERDUE:   '#D97706',
            SENT:      '#2563EB',
            CANCELLED: '#DC2626',
            DEFAULT:   '#4F46E5'
        }
    },
    page: { width: 595.28, height: 841.89, margin: 50 },
    fonts: {
        bold: 'Helvetica-Bold',
        regular: 'Helvetica'
    }
};

const CONTENT_W = STYLES.page.width - STYLES.page.margin * 2;

// ── Helper Utilities ───────────────────────────────────────────────

const formatters = {
    currency: (n, code) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code || 'USD',
    }).format(n ?? 0),

    date: (d) => {
        if (!d) return '—';
        try {
            return new Date(d).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
            });
        } catch { return String(d).slice(0, 10); }
    }
};

/**
 * Encapsulates the logic for drawing a professional invoice.
 */
class InvoiceDrawer {
    constructor(doc, invoice) {
        this.doc = doc;
        this.invoice = invoice;
        this.fmt = (n) => formatters.currency(n, invoice.currency);
    }

    draw() {
        this.drawHeaderBand();
        this.drawMetaRow();
        this.drawParties();

        let y = this.drawLineItemsTable(330);
        y = this.drawTotals(y + 16);

        if (this.invoice.bank_details || this.invoice.payment_instructions) {
            this.drawSectionHeader('PAYMENT DETAILS', y + 32);
            this.doc.fontSize(9.5).font(STYLES.fonts.regular).fillColor(STYLES.colors.text)
                .text(this.invoice.bank_details || this.invoice.payment_instructions, STYLES.page.margin, y + 50, { width: CONTENT_W / 2 });
            y += 100;
        }

        if (this.invoice.notes) {
            this.drawSectionHeader('NOTES', y + 32);
            this.doc.fontSize(9.5).font(STYLES.fonts.regular).fillColor(STYLES.colors.muted)
                .text(this.invoice.notes, STYLES.page.margin, y + 50, { width: CONTENT_W });
        }

        this.drawFooter();
    }

    drawSectionHeader(label, y) {
        this.doc.fontSize(8).font(STYLES.fonts.regular).fillColor(STYLES.colors.muted).text(label, STYLES.page.margin, y);
        this.doc.moveTo(STYLES.page.margin, y + 12).lineTo(STYLES.page.margin + CONTENT_W, y + 12)
            .strokeColor(STYLES.colors.divider).lineWidth(0.5).stroke();
    }

    drawHeaderBand() {
        const { doc, invoice } = this;
        doc.rect(0, 0, STYLES.page.width, 130).fill(STYLES.colors.accent);

        // Wordmark & #
        doc.fontSize(28).font(STYLES.fonts.bold).fillColor(STYLES.colors.white).text('INVOICE', STYLES.page.margin, 36);
        doc.fontSize(10).font(STYLES.fonts.regular).fillColor([255,255,255], 75).text(`#${invoice.invoice_number ?? '—'}`, STYLES.page.margin, 70);

        // Sender Info
        doc.fontSize(13).font(STYLES.fonts.bold).fillColor(STYLES.colors.white)
            .text(invoice.sender_name || 'Freelance Desk', STYLES.page.margin, 36, { align: 'right', width: CONTENT_W });
        
        const contact = [invoice.sender_email, invoice.sender_address].filter(Boolean).join('  ·  ');
        doc.fontSize(9).font(STYLES.fonts.regular).fillColor([255,255,255], 80)
            .text(contact, STYLES.page.margin, 56, { align: 'right', width: CONTENT_W });

        // Total
        doc.fontSize(20).font(STYLES.fonts.bold).fillColor(STYLES.colors.white)
            .text(this.fmt(invoice.total_amount), STYLES.page.margin, 78, { align: 'right', width: CONTENT_W });
        doc.fontSize(8).text(`Total amount incl. ${invoice.tax_rate ?? 0}% tax`, STYLES.page.margin, 103, { align: 'right', width: CONTENT_W });
    }

    drawMetaRow() {
        const { doc, invoice } = this;
        const y = 148;
        doc.rect(STYLES.page.margin, y - 8, CONTENT_W, 46).fill(STYLES.colors.accentLight);

        const cols = [
            { label: 'Issue Date', value: formatters.date(invoice.issue_date), x: STYLES.page.margin + 16 },
            { label: 'Due Date',   value: formatters.date(invoice.due_date),   x: 220 },
            { label: 'Currency',   value: invoice.currency || 'USD',           x: 370 },
            { label: 'Status',     value: (invoice.status ?? 'draft').toUpperCase(), x: 460 },
        ];

        cols.forEach(col => {
            doc.fontSize(8).font(STYLES.fonts.regular).fillColor(STYLES.colors.muted).text(col.label, col.x, y);
            if (col.label === 'Status') this.drawStatusBadge(col.value, col.x, y + 13);
            else doc.fontSize(10).font(STYLES.fonts.bold).fillColor(STYLES.colors.text).text(col.value, col.x, y + 13);
        });
    }

    drawStatusBadge(status, x, y) {
        const color = STYLES.colors.status[status] || STYLES.colors.status.DEFAULT;
        const width = Math.max(52, status.length * 6.5 + 12);
        this.doc.roundedRect(x, y, width, 16, 4).fill(color);
        this.doc.fontSize(8).font(STYLES.fonts.bold).fillColor(STYLES.colors.white).text(status, x, y + 3, { width, align: 'center' });
    }

    drawParties() {
        const y = 218;
        this.drawSectionHeader('BILL TO', y);
        this.doc.text('FROM', 300, y);

        const drawInfo = (name, email, addr, x) => {
            this.doc.fontSize(12).font(STYLES.fonts.bold).fillColor(STYLES.colors.text).text(name ?? '—', x, y + 18);
            this.doc.fontSize(9).font(STYLES.fonts.regular).fillColor(STYLES.colors.muted)
                .text(email ?? '', x, y + 34)
                .text(addr ?? '', x, y + 47, { width: 220 });
        };

        drawInfo(this.invoice.client_name, this.invoice.client_email, this.invoice.client_address, STYLES.page.margin);
        drawInfo(this.invoice.sender_name || 'Freelance Desk', this.invoice.sender_email, this.invoice.sender_address, 300);
    }

    drawLineItemsTable(y) {
        const { doc, invoice } = this;
        const colX = { desc: STYLES.page.margin, qty: 340, rate: 390, amount: 460 };
        
        doc.rect(STYLES.page.margin, y, CONTENT_W, 22).fill(STYLES.colors.text);
        doc.fontSize(8.5).font(STYLES.fonts.bold).fillColor(STYLES.colors.white);
        doc.text('DESCRIPTION', colX.desc + 6, y + 7);
        doc.text('QTY', colX.qty, y + 7, { width: 42, align: 'right' });
        doc.text('RATE', colX.rate, y + 7, { width: 60, align: 'right' });
        doc.text('AMOUNT', colX.amount, y + 7, { width: 85, align: 'right' });

        y += 22;
        const items = (invoice.line_items?.length) ? invoice.line_items : [{ description: invoice.notes || 'Services', quantity: 1, rate: invoice.amount, amount: invoice.amount }];

        items.forEach((item, i) => {
            const h = Math.max(26, doc.heightOfString(item.description, { width: 270, fontSize: 10 }) + 14);
            if (i % 2) doc.rect(STYLES.page.margin, y, CONTENT_W, h).fill(STYLES.colors.rowAlt);

            doc.fontSize(10).font(STYLES.fonts.regular).fillColor(STYLES.colors.text).text(item.description, colX.desc + 6, y + 8, { width: 270 });
            doc.fillColor(STYLES.colors.muted).text(String(item.quantity), colX.qty, y + 8, { width: 42, align: 'right' });
            doc.text(this.fmt(item.rate), colX.rate, y + 8, { width: 60, align: 'right' });
            doc.font(STYLES.fonts.bold).fillColor(STYLES.colors.text).text(this.fmt(item.amount), colX.amount, y + 8, { width: 85, align: 'right' });
            y += h;
        });

        doc.moveTo(STYLES.page.margin, y).lineTo(STYLES.page.margin + CONTENT_W, y).strokeColor(STYLES.colors.divider).stroke();
        return y;
    }

    drawTotals(y) {
        const { doc, invoice } = this;
        const labelX = 360, valueX = 460, valueW = 85;

        const drawRow = (label, val, isBold) => {
            doc.fontSize(9.5).font(isBold ? STYLES.fonts.bold : STYLES.fonts.regular).fillColor(STYLES.colors.muted).text(label, labelX, y);
            doc.fillColor(STYLES.colors.text).text(this.fmt(val), valueX, y, { width: valueW, align: 'right' });
            y += 20;
        };

        drawRow('Subtotal', invoice.amount);
        if (parseFloat(invoice.tax_rate) > 0) drawRow(`Tax (${invoice.tax_rate}%)`, invoice.tax_amount);

        y += 4;
        doc.rect(labelX - 10, y, CONTENT_W - (labelX - 10 - STYLES.page.margin), 28).fill(STYLES.colors.accent);
        doc.fontSize(12).font(STYLES.fonts.bold).fillColor(STYLES.colors.white).text('Total Due', labelX, y + 8);
        doc.text(this.fmt(invoice.total_amount), labelX - 10, y + 8, { width: CONTENT_W - (labelX - 10 - STYLES.page.margin) - 10, align: 'right' });

        return y + 28;
    }

    drawFooter() {
        const range = this.doc.bufferedPageRange();
        this.doc.switchToPage(range.start + range.count - 1);
        this.doc.page.margins.bottom = 0;
        this.doc.rect(0, STYLES.page.height - 28, STYLES.page.width, 28).fill(STYLES.colors.accent);
        this.doc.fontSize(7.5).fillColor([255,255,255], 80).text('Generated by freelance. — your all-in-one dashboard', STYLES.page.margin, STYLES.page.height - 19, { width: CONTENT_W, align: 'center' });
    }
}

// ── Public Exports ──────────────────────────────────────────────────

export async function generateInvoicePdf(invoice) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: STYLES.page.margin, size: 'A4', bufferPages: true, autoFirstPage: false });
        doc.addPage();
        const chunks = [];
        doc.on('data', c => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        new InvoiceDrawer(doc, invoice).draw();
        doc.end();
    });
}

export async function uploadToStorage(buffer, filename) {
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: filename, Body: buffer, ContentType: 'application/pdf' }));
    const base = process.env.R2_PUBLIC_URL || `${process.env.S3_ENDPOINT}/${BUCKET}`;
    return `${base}/${filename}`;
}
