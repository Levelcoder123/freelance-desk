// tests/integration/invoices.test.js
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { request, app, createTestUser, createTestClient, cleanUser } from '../setup.js';

let auth, client, invoiceId;

beforeAll(async () => {
    auth = await createTestUser();
    client = await createTestClient(auth.user.id);
});
afterAll(async () => { await cleanUser(auth.user.id); });

describe('Invoices routes', () => {
    describe('POST /invoices', () => {
        it('201 — creates invoice', async () => {
            const res = await request(app).post('/api/v1/invoices')
                .set('Authorization', `Bearer ${auth.accessToken}`)
                .send({
                    client_id: client.id, invoice_number: 'INV-001',
                    amount: 1000, currency: 'USD', tax_rate: 10, due_date: '2025-12-31',
                    line_items: [{ description: 'Dev work', quantity: 10, rate: 100, amount: 1000 }],
                });
            expect(res.status).toBe(201);
            expect(res.body.invoice_number).toBe('INV-001');
            expect(parseFloat(res.body.total_amount)).toBe(1100);  // generated column
            invoiceId = res.body.id;
        });

        it('409 — duplicate invoice_number for same user', async () => {
            const res = await request(app).post('/api/v1/invoices')
                .set('Authorization', `Bearer ${auth.accessToken}`)
                .send({ invoice_number: 'INV-001', amount: 500 });
            expect(res.status).toBe(409);
        });

        it('422 — negative amount', async () => {
            const res = await request(app).post('/api/v1/invoices')
                .set('Authorization', `Bearer ${auth.accessToken}`)
                .send({ invoice_number: 'INV-002', amount: -1 });
            expect(res.status).toBe(422);
        });
    });

    describe('GET /invoices', () => {
        it('200 — returns list with client_name', async () => {
            const res = await request(app).get('/api/v1/invoices')
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data[0].client_name).toBeDefined();
        });

        it('200 — filters by status', async () => {
            const res = await request(app).get('/api/v1/invoices?status=draft')
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(200);
            res.body.data.forEach(i => expect(i.status).toBe('draft'));
        });
    });

    describe('GET /invoices/:id', () => {
        it('200 — returns full invoice with client fields', async () => {
            const res = await request(app).get(`/api/v1/invoices/${invoiceId}`)
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(200);
            expect(res.body.client_email).toBeDefined();
        });

        it('404 — unknown id', async () => {
            const res = await request(app)
                .get('/api/v1/invoices/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(404);
        });
    });

    describe('PATCH /invoices/:id', () => {
        it('200 — marks invoice as paid and sets paid_at', async () => {
            const res = await request(app).patch(`/api/v1/invoices/${invoiceId}`)
                .set('Authorization', `Bearer ${auth.accessToken}`)
                .send({ status: 'paid' });
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('paid');
            expect(res.body.paid_at).not.toBeNull();
        });

        it('200 — clears paid_at when status reverts to pending', async () => {
            const res = await request(app).patch(`/api/v1/invoices/${invoiceId}`)
                .set('Authorization', `Bearer ${auth.accessToken}`)
                .send({ status: 'pending' });
            expect(res.status).toBe(200);
            expect(res.body.paid_at).toBeNull();
        });
    });

    describe('POST /invoices/:id/send', () => {
        it('200 — queues job and sets status to pending', async () => {
            const res = await request(app).post(`/api/v1/invoices/${invoiceId}/send`)
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(200);
            expect(res.body.invoice_id).toBe(invoiceId);
            // Verify status updated in DB
            const check = await request(app).get(`/api/v1/invoices/${invoiceId}`)
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(check.body.status).toBe('pending');
        });

        it('404 — cannot send another user\'s invoice', async () => {
            const other = await createTestUser();
            const res = await request(app).post(`/api/v1/invoices/${invoiceId}/send`)
                .set('Authorization', `Bearer ${other.accessToken}`);
            expect(res.status).toBe(404);
            await cleanUser(other.user.id);
        });
    });

    describe('DELETE /invoices/:id', () => {
        it('204 — deletes invoice', async () => {
            const res = await request(app).delete(`/api/v1/invoices/${invoiceId}`)
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(204);
        });
    });
});
