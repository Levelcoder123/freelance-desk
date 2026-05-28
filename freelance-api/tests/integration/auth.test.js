// tests/integration/auth.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { request, app, cleanUser, closeTestResources } from '../setup/setup.js';

let tokens, userId;

describe('Auth routes', () => {
    const email = `auth_${Date.now()}@example.com`;
    const password = 'TestPass123!';

    afterAll(async () => {
        await cleanUser(userId);
        await closeTestResources();
    });

    describe('POST /auth/register', () => {
        it('201 — creates user and returns tokens', async () => {
            const res = await request(app).post('/api/v1/auth/register')
                .send({ fullName: 'Jane Doe', email, password });
            expect(res.status).toBe(201);
            expect(res.body.access_token).toBeDefined();
            expect(res.body.refresh_token).toBeDefined();
            tokens = { access: res.body.access_token, refresh: res.body.refresh_token };
            userId = res.body.user.id;
        });

        it('409 — duplicate email', async () => {
            const res = await request(app).post('/api/v1/auth/register')
                .send({ fullName: 'Jane Doe', email, password });
            expect(res.status).toBe(409);
        });

        it('422 — missing fullName', async () => {
            const res = await request(app).post('/api/v1/auth/register')
                .send({ email: 'x@x.com', password });
            expect(res.status).toBe(422);
        });

        it('422 — weak password', async () => {
            const res = await request(app).post('/api/v1/auth/register')
                .send({ fullName: 'X', email: 'new@x.com', password: 'short' });
            expect(res.status).toBe(422);
        });
    });

    describe('POST /auth/login', () => {
        it('200 — returns tokens on valid creds', async () => {
            const res = await request(app).post('/api/v1/auth/login').send({ email, password });
            expect(res.status).toBe(200);
            expect(res.body.access_token).toBeDefined();
            tokens = { access: res.body.access_token, refresh: res.body.refresh_token };
        });

        it('401 — wrong password', async () => {
            const res = await request(app).post('/api/v1/auth/login')
                .send({ email, password: 'WrongPass!' });
            expect(res.status).toBe(401);
        });

        it('401 — unknown email', async () => {
            const res = await request(app).post('/api/v1/auth/login')
                .send({ email: 'nobody@example.com', password });
            expect(res.status).toBe(401);
        });
    });

    describe('GET /auth/me', () => {
        it('200 — returns user profile', async () => {
            const res = await request(app).get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${tokens.access}`);
            expect(res.status).toBe(200);
            expect(res.body.email).toBe(email);
            expect(res.body.passwordHash).toBeUndefined();
        });

        it('401 — no token', async () => {
            const res = await request(app).get('/api/v1/auth/me');
            expect(res.status).toBe(401);
        });

        it('401 — tampered token', async () => {
            const res = await request(app).get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${tokens.access}x`);
            expect(res.status).toBe(401);
        });
    });

    describe('PATCH /auth/me', () => {
        it('200 — updates allowed fields', async () => {
            const res = await request(app).patch('/api/v1/auth/me')
                .set('Authorization', `Bearer ${tokens.access}`)
                .send({ fullName: 'Jane Updated', monthlyGoal: 5000 });
            expect(res.status).toBe(200);
            expect(res.body.fullName).toBe('Jane Updated');
            expect(Number(res.body.monthlyGoal)).toBe(5000);
        });

        it('400 — no valid fields sent', async () => {
            const res = await request(app).patch('/api/v1/auth/me')
                .set('Authorization', `Bearer ${tokens.access}`)
                .send({ plan: 'pro' }); // plan is not in the allowlist
            expect(res.status).toBe(400);
        });
    });

    describe('POST /auth/refresh', () => {
        it('200 — rotates tokens', async () => {
            const res = await request(app).post('/api/v1/auth/refresh')
                .send({ refresh_token: tokens.refresh });
            expect(res.status).toBe(200);
            expect(res.body.access_token).toBeDefined();
            // Old refresh token should now be invalid
            const retry = await request(app).post('/api/v1/auth/refresh')
                .send({ refresh_token: tokens.refresh });
            expect(retry.status).toBe(401);
            tokens = { access: res.body.access_token, refresh: res.body.refresh_token };
        });
    });

    describe('POST /auth/logout', () => {
        it('200 — revokes all refresh tokens', async () => {
            const res = await request(app).post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${tokens.access}`);
            expect(res.status).toBe(200);
            // Refresh should now fail
            const retry = await request(app).post('/api/v1/auth/refresh')
                .send({ refresh_token: tokens.refresh });
            expect(retry.status).toBe(401);
        });
    });
});
