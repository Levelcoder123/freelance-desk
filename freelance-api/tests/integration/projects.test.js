// tests/integration/projects.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { request, app, createTestUser, createTestClient, cleanUser, closeTestResources } from '../setup/setup.js';

let auth, client, projectId;

beforeAll(async () => {
    auth = await createTestUser();
    client = await createTestClient(auth.user.id);
});
afterAll(async () => {
    await cleanUser(auth.user.id);
    await closeTestResources();
});

describe('Projects routes', () => {
    describe('POST /projects', () => {
        it('201 — creates project', async () => {
            const res = await request(app).post('/api/v1/projects')
                .set('Authorization', `Bearer ${auth.accessToken}`)
                .send({
                    client_id: client.id, name: 'Website Redesign',
                    priority: 'high', deadline: '2025-06-30', budget: 5000
                });
            expect(res.status).toBe(201);
            expect(res.body.name).toBe('Website Redesign');
            expect(res.body.progress).toBe(0);
            projectId = res.body.id;
        });

        it('422 — missing name', async () => {
            const res = await request(app).post('/api/v1/projects')
                .set('Authorization', `Bearer ${auth.accessToken}`)
                .send({ priority: 'low' });
            expect(res.status).toBe(422);
        });
    });

    describe('GET /projects', () => {
        it('200 — returns all projects with clientName', async () => {
            const res = await request(app).get('/api/v1/projects')
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data[0].clientName).toBeDefined();
        });

        it('200 — filters by priority', async () => {
            const res = await request(app).get('/api/v1/projects?priority=high')
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(200);
            res.body.data.forEach(p => expect(p.priority).toBe('high'));
        });

        it('200 — filters by status', async () => {
            const res = await request(app).get('/api/v1/projects?status=active')
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(200);
            res.body.data.forEach(p => expect(p.status).toBe('active'));
        });
    });

    describe('PATCH /projects/:id', () => {
        it('200 — updates progress and status', async () => {
            const res = await request(app).patch(`/api/v1/projects/${projectId}`)
                .set('Authorization', `Bearer ${auth.accessToken}`)
                .send({ progress: 75, status: 'active' });
            expect(res.status).toBe(200);
            expect(res.body.progress).toBe(75);
        });

        it('422 — progress out of range', async () => {
            const res = await request(app).patch(`/api/v1/projects/${projectId}`)
                .set('Authorization', `Bearer ${auth.accessToken}`)
                .send({ progress: 150 });
            expect(res.status).toBe(422);
        });

        it('404 — another user cannot update', async () => {
            const other = await createTestUser();
            const res = await request(app).patch(`/api/v1/projects/${projectId}`)
                .set('Authorization', `Bearer ${other.accessToken}`)
                .send({ name: 'Hijacked' });
            expect(res.status).toBe(404);
            await cleanUser(other.user.id);
        });
    });

    describe('DELETE /projects/:id', () => {
        it('204 — deletes project', async () => {
            const res = await request(app).delete(`/api/v1/projects/${projectId}`)
                .set('Authorization', `Bearer ${auth.accessToken}`);
            expect(res.status).toBe(204);
        });
    });
});
