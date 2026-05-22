// tests/integration/dashboard.test.js
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { request, app, createTestUser, createTestClient, cleanUser, query, closeTestResources } from '../setup/setup.js';

let auth;

beforeAll(async () => {
    auth = await createTestUser();
    // Seed some data so dashboard isn't all zeroes
    const client = await createTestClient(auth.user.id);
    await query(
        `INSERT INTO invoices(user_id, client_id, invoice_number, amount, status, paid_at)
     VALUES($1,$2,'INV-DASH-001',1500,'paid',NOW())`,
        [auth.user.id, client.id]
    );
    await query(
        `INSERT INTO expenses(user_id, description, amount, category)
     VALUES($1,'Test expense',200,'Software')`,
        [auth.user.id]
    );
});
afterAll(async () => {
    await cleanUser(auth.user.id);
    await closeTestResources();
});

describe('Dashboard route', () => {
    it('200 — returns all expected top-level keys', async () => {
        const res = await request(app).get('/api/v1/dashboard')
            .set('Authorization', `Bearer ${auth.accessToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('summary');
        expect(res.body).toHaveProperty('monthly_revenue');
        expect(res.body).toHaveProperty('deadlines');
        expect(res.body).toHaveProperty('recent_invoices');
        expect(res.body).toHaveProperty('tax');
        expect(res.body).toHaveProperty('goal');
    });

    it('summary.total_earned reflects seeded paid invoice', async () => {
        const res = await request(app).get('/api/v1/dashboard')
            .set('Authorization', `Bearer ${auth.accessToken}`);
        expect(parseFloat(res.body.summary.total_earned)).toBeGreaterThanOrEqual(1500);
    });

    it('tax object has correct shape', async () => {
        const res = await request(app).get('/api/v1/dashboard')
            .set('Authorization', `Bearer ${auth.accessToken}`);
        const { tax } = res.body;
        expect(typeof tax.gross).toBe('number');
        expect(typeof tax.tax_owed).toBe('number');
        expect(typeof tax.taxable).toBe('number');
        expect(tax.tax_owed).toBeGreaterThanOrEqual(0);
    });

    it('goal.percent is between 0 and 100', async () => {
        const res = await request(app).get('/api/v1/dashboard')
            .set('Authorization', `Bearer ${auth.accessToken}`);
        expect(res.body.goal.percent).toBeGreaterThanOrEqual(0);
        expect(res.body.goal.percent).toBeLessThanOrEqual(100);
    });

    it('401 — no auth', async () => {
        const res = await request(app).get('/api/v1/dashboard');
        expect(res.status).toBe(401);
    });
});
