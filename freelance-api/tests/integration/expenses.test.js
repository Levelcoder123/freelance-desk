// tests/integration/expenses.test.js
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { request, app, createTestUser, cleanUser, closeTestResources } from '../setup/setup.js';

let auth, expenseId;

beforeAll(async () => { auth = await createTestUser(); });
afterAll(async () => {
    await cleanUser(auth.user.id);
    await closeTestResources();
});

describe('Expenses routes', () => {
    describe('POST /expenses', () => {
        it('201 — creates expense', async () => {
            const res = await request(app).post('/api/v1/expenses')
                .set('Authorization', `Bearer ${auth.accessToken}`)
                .send({
                    description: 'Adobe CC', amount: 54.99,
                    category: 'Software', expense_date: '2024-01-15'
                });
            expect(res.status).toBe(201);
            expect(res.body.category).toBe('Software');
            expenseId = res.body.id;
        });

        it('422 — invalid category', async () => {
            const res = await request(app).post('/api/v1/expenses')
                .set('Authorization', `Bearer ${auth.accessToken}`)
                .send({ description: 'Misc', amount: 10, category: 'InvalidCat' });
            expect(res.status).toBe(422);
        });

        it('422 — negative amount', async () => {
            const res = await request(app).post('/api/v1/expenses')
                .set('Authorization', `Bearer ${auth.accessToken}`)
                .send({ description: 'Refund', amount: -20, category: 'Other' });
            expect(res.status).toBe(422);
        });
    });

    describe('GET /expenses', () => {
        it('200 — returns data + summary + total', async () => {
            const res = await request(app).get('/api/v1/expenses')
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(Array.isArray(res.body.summary)).toBe(true);
            expect(typeof res.body.total).toBe('number');
        });

        it('200 — filters by category', async () => {
            const res = await request(app).get('/api/v1/expenses?category=Software')
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(200);
            res.body.data.forEach(e => expect(e.category).toBe('Software'));
        });

        it('200 — filters by year', async () => {
            const res = await request(app).get('/api/v1/expenses?year=2024')
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(200);
            res.body.data.forEach(e =>
                expect(new Date(e.expense_date).getFullYear()).toBe(2024));
        });
    });

    describe('PATCH /expenses/:id', () => {
        it('200 — updates amount and notes', async () => {
            const res = await request(app).patch(`/api/v1/expenses/${expenseId}`)
                .set('Authorization', `Bearer ${auth.accessToken}`)
                .send({ amount: 59.99, notes: 'Annual plan' });
            expect(res.status).toBe(200);
            expect(parseFloat(res.body.amount)).toBe(59.99);
            expect(res.body.notes).toBe('Annual plan');
        });
    });

    describe('DELETE /expenses/:id', () => {
        it('204 — deletes expense', async () => {
            const res = await request(app).delete(`/api/v1/expenses/${expenseId}`)
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(204);
        });

        it('404 — already deleted', async () => {
            const res = await request(app).delete(`/api/v1/expenses/${expenseId}`)
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(404);
        });
    });
});
