// tests/unit/services.unit.test.js
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ── pdfService ────────────────────────────────────────────────────────────────
describe('pdfService — generateInvoicePdf', () => {
    it('returns a Buffer', async () => {
        const { generateInvoicePdf } = await import('../../src/services/pdfService.js');
        const invoice = {
            invoice_number: 'INV-001', amount: 1000, tax_rate: 10,
            tax_amount: 100, total_amount: 1100, currency: 'USD',
            status: 'pending', issue_date: '2024-01-01', due_date: '2024-01-31',
            client_name: 'Acme', client_email: 'acme@example.com',
            client_address: '123 Main St', notes: 'Thanks!',
            line_items: [{ description: 'Dev work', quantity: 10, rate: 100, amount: 1000 }],
            user_id: 'user-uuid',
        };
        const buf = await generateInvoicePdf(invoice);
        expect(Buffer.isBuffer(buf)).toBe(true);
        expect(buf.length).toBeGreaterThan(0);
    });

    it('handles empty line_items gracefully', async () => {
        const { generateInvoicePdf } = await import('../../src/services/pdfService.js');
        const invoice = {
            invoice_number: 'INV-002', amount: 500, tax_rate: 0,
            tax_amount: 0, total_amount: 500, currency: 'USD',
            status: 'draft', issue_date: '2024-01-01',
            client_name: 'Bob', line_items: [], user_id: 'user-uuid',
        };
        await expect(generateInvoicePdf(invoice)).resolves.toBeInstanceOf(Buffer);
    });
});

// ── emailService ──────────────────────────────────────────────────────────────
describe('emailService', () => {
    let sendMock;

    beforeEach(async () => {
        sendMock = jest.fn().mockResolvedValue({ id: 'email-id' });
        jest.doMock('resend', () => ({
            Resend: jest.fn().mockImplementation(() => ({ emails: { send: sendMock } })),
        }));
    });

    it('sendInvoiceEmail calls resend with correct subject', async () => {
        const { sendInvoiceEmail } = await import('../../src/services/emailService.js');
        await sendInvoiceEmail({
            to: 'client@example.com', invoiceNumber: 'INV-001',
            clientName: 'Acme', amount: 1100, currency: 'USD',
            dueDate: '2024-01-31', pdfUrl: 'https://r2.example.com/inv.pdf',
            paymentLink: 'https://buy.stripe.com/test',
        });
        expect(sendMock).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'client@example.com',
                subject: expect.stringContaining('INV-001')
            })
        );
    });

    it('sendWeeklySummary includes earned amount in html', async () => {
        const { sendWeeklySummary } = await import('../../src/services/emailService.js');
        await sendWeeklySummary({
            to: 'freelancer@example.com', name: 'Jane',
            stats: { earned: 2500, pending: 500, invoicesSent: 3, topClient: 'Acme' },
        });
        const call = sendMock.mock.calls[0][0];
        expect(call.html).toContain('2,500');
        expect(call.html).toContain('Acme');
    });
});
