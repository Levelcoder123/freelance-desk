// tests/setup/setup.js
import { afterAll, vi } from 'vitest';

// ── Mock BullMQ so workers don't need Redis in tests ─────────────────────────
const redisMock = {
    duplicate: vi.fn(() => redisMock),
    disconnect: vi.fn(),
    quit: vi.fn().mockResolvedValue('OK'),
    on: vi.fn(),
};

vi.mock('ioredis', () => ({
    default: vi.fn().mockImplementation(function() { return redisMock; }),
    Redis: vi.fn().mockImplementation(function() { return redisMock; }),
}));

vi.mock('../../src/config/redis.js', () => ({
    default: redisMock,
}));

vi.mock('express-rate-limit', () => ({
    default: vi.fn(() => (_req, _res, next) => next()),
}));

vi.mock('bullmq', () => ({
    Queue: vi.fn().mockImplementation(function() {
        return {
            add: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
        };
    }),
    Worker: vi.fn().mockImplementation(function() {
        return {
            on: vi.fn(),
        };
    }),
}));

// ── Mock external services ────────────────────────────────────────────────────
vi.mock('../../src/services/stripeService.js', () => ({
    createPaymentLink: vi.fn().mockResolvedValue('https://buy.stripe.com/test'),
    constructWebhookEvent: vi.fn(),
}));

vi.mock('../../src/services/emailService.js', () => ({
    sendInvoiceEmail: vi.fn().mockResolvedValue(undefined),
    sendPaymentConfirmation: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    sendWeeklySummary: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/services/pdfService.js', () => ({
    generateInvoicePdf: vi.fn().mockResolvedValue(Buffer.from('PDF')),
    uploadToStorage: vi.fn().mockResolvedValue('https://r2.example.com/test.pdf'),
}));

// ── Helpers available globally ────────────────────────────────────────────────
import _supertest from 'supertest';
import bcrypt from 'bcryptjs';

const request = _supertest.default || _supertest;


const { default: expressApp } = await import('../../src/index.js');
const { query, pool } = await import('../../src/config/database.js');
const app = expressApp.listen(0);
const sockets = new Set();
let serverClosed = false;

app.keepAliveTimeout = 0;
app.on('connection', socket => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
});

async function closeServer() {
    if (serverClosed) return;
    serverClosed = true;
    for (const socket of sockets) {
        socket.destroy();
    }
    app.closeAllConnections?.();
    app.closeIdleConnections?.();
    await new Promise(resolve => app.close(resolve));
}

afterAll(closeServer);

export async function closeTestResources() {
    await closeServer();
    await pool.end();
}

export { request, query, bcrypt, app };

/**
 * Creates a user and returns { user, accessToken, refreshToken }
 */
export async function createTestUser(overrides = {}) {
    const email = overrides.email || `test_${Date.now()}@example.com`;
    const password = overrides.password || 'Password123!';
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
        `INSERT INTO users(full_name, email, password_hash)
     VALUES($1,$2,$3) RETURNING id, full_name, email, plan`,
        [overrides.full_name || 'Test User', email, hash]
    );
    const user = rows[0];

    // Log in to get tokens
    const res = await request(app).post('/api/v1/auth/login')
        .send({ email, password });

    return {
        user, accessToken: res.body.access_token,
        refreshToken: res.body.refresh_token, password
    };
}

/**
 * Creates a client belonging to userId and returns the row.
 */
export async function createTestClient(userId, overrides = {}) {
    const { rows } = await query(
        `INSERT INTO clients(user_id, name, email, status)
     VALUES($1,$2,$3,'active') RETURNING *`,
        [userId, overrides.name || 'Acme Corp', overrides.email || 'acme@example.com']
    );
    return rows[0];
}

/**
 * Wipes user-owned data between tests (faster than full TRUNCATE).
 */
export async function cleanUser(userId) {
    await query('DELETE FROM users WHERE id=$1', [userId]);
}
