// tests/setup/setup.js
import { afterAll, jest } from '@jest/globals';

// ── Mock BullMQ so workers don't need Redis in tests ─────────────────────────
const redisMock = {
    duplicate: jest.fn(() => redisMock),
    disconnect: jest.fn(),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
};

jest.unstable_mockModule('ioredis', () => ({
    default: jest.fn(() => redisMock),
    Redis: jest.fn(() => redisMock),
}));

jest.unstable_mockModule('../../src/config/redis.js', () => ({
    default: redisMock,
}));

jest.unstable_mockModule('express-rate-limit', () => ({
    default: jest.fn(() => (_req, _res, next) => next()),
}));

jest.unstable_mockModule('bullmq', () => ({
    Queue: jest.fn().mockImplementation(() => ({
        add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    })),
    Worker: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
    })),
}));

// ── Mock external services ────────────────────────────────────────────────────
jest.unstable_mockModule('../../src/services/stripeService.js', () => ({
    createPaymentLink: jest.fn().mockResolvedValue('https://buy.stripe.com/test'),
    constructWebhookEvent: jest.fn(),
}));

jest.unstable_mockModule('../../src/services/emailService.js', () => ({
    sendInvoiceEmail: jest.fn().mockResolvedValue(undefined),
    sendPaymentConfirmation: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    sendWeeklySummary: jest.fn().mockResolvedValue(undefined),
}));

jest.unstable_mockModule('../../src/services/pdfService.js', () => ({
    generateInvoicePdf: jest.fn().mockResolvedValue(Buffer.from('PDF')),
    uploadToStorage: jest.fn().mockResolvedValue('https://r2.example.com/test.pdf'),
}));

// ── Helpers available globally ────────────────────────────────────────────────
import request from 'supertest';
import bcrypt from 'bcryptjs';

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
