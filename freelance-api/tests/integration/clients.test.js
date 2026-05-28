// tests/integration/clients.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { request, app, createTestUser, cleanUser, closeTestResources } from '../setup/setup.js';

let auth, clientId;

beforeAll(async () => { auth = await createTestUser(); });
afterAll(async () => {
    await cleanUser(auth.user.id);
    await closeTestResources();
});

describe('Clients routes', () => {
    describe('POST /clients', () => {
        it('201 — creates client', async () => {
            const res = await request(app).post('/api/v1/clients')
                .set('Authorization', `Bearer ${auth.accessToken}`)
                .send({
                    name: 'Acme Corp', email: 'acme@example.com',
                    company: 'Acme', hourly_rate: 100
                });
            expect(res.status).toBe(201);
            expect(res.body.name).toBe('Acme Corp');
            clientId = res.body.id;
        });

        it('422 — missing name', async () => {
            const res = await request(app).post('/api/v1/clients')
                .set('Authorization', `Bearer ${auth.accessToken}`)
                .send({ email: 'x@x.com' });
            expect(res.status).toBe(422);
        });

        it('401 — no auth', async () => {
            const res = await request(app).post('/api/v1/clients')
                .send({ name: 'Ghost' });
            expect(res.status).toBe(401);
        });
    });

    describe('GET /clients', () => {
        it('200 — returns paginated list', async () => {
            const res = await request(app).get('/api/v1/clients')
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
        });

        it('200 — filters by status', async () => {
            const res = await request(app).get('/api/v1/clients?status=active')
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(200);
            res.body.data.forEach(c => expect(c.status).toBe('active'));
        });

        it('200 — full-text search returns relevant results', async () => {
            const res = await request(app).get('/api/v1/clients?search=Acme')
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.some(c => c.name === 'Acme Corp')).toBe(true);
        });
    });

    describe('GET /clients/:id', () => {
        it('200 — returns client with invoices array', async () => {
            const res = await request(app).get(`/api/v1/clients/${clientId}`)
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(200);
            expect(res.body.id).toBe(clientId);
            expect(Array.isArray(res.body.invoices)).toBe(true);
        });

        it('404 — unknown id', async () => {
            const res = await request(app)
                .get('/api/v1/clients/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(404);
        });
    });

    describe('PATCH /clients/:id', () => {
        it('200 — updates fields', async () => {
            const res = await request(app).patch(`/api/v1/clients/${clientId}`)
                .set('Authorization', `Bearer ${auth.accessToken}`)
                .send({ hourlyRate: 150, status: 'inactive' });
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('inactive');
            expect(parseFloat(res.body.hourlyRate)).toBe(150);
        });

        it('404 — another user cannot update', async () => {
            const other = await createTestUser();
            const res = await request(app).patch(`/api/v1/clients/${clientId}`)
                .set('Authorization', `Bearer ${other.accessToken}`)
                .send({ name: 'Hijacked' });
            expect(res.status).toBe(404);
            await cleanUser(other.user.id);
        });
    });

    describe('DELETE /clients/:id', () => {
        it('204 — deletes client', async () => {
            const res = await request(app).delete(`/api/v1/clients/${clientId}`)
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(204);
        });

        it('404 — already deleted', async () => {
            const res = await request(app).delete(`/api/v1/clients/${clientId}`)
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(404);
        });
    });
});
