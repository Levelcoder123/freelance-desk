// tests/setup/setup.js
import { jest } from '@jest/globals';

// ── Mock BullMQ so workers don't need Redis in tests ─────────────────────────
jest.mock('bullmq', () => ({
    Queue: jest.fn().mockImplementation(() => ({
        add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    })),
    Worker: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
    })),
}));

// ── Mock external services ────────────────────────────────────────────────────
jest.mock('../src/services/stripeService.js', () => ({
    createPaymentLink: jest.fn().mockResolvedValue('https://buy.stripe.com/test'),
    constructWebhookEvent: jest.fn(),
}));

jest.mock('../src/services/emailService.js', () => ({
    sendInvoiceEmail: jest.fn().mockResolvedValue(undefined),
    sendPaymentConfirmation: jest.fn().mockResolvedValue(undefined),
    sendWeeklySummary: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/services/pdfService.js', () => ({
    generateInvoicePdf: jest.fn().mockResolvedValue(Buffer.from('PDF')),
    uploadToStorage: jest.fn().mockResolvedValue('https://r2.example.com/test.pdf'),
}));

// ── Helpers available globally ────────────────────────────────────────────────
import request from 'supertest';
import app from '../src/index.js';
import { query } from '../src/config/database.js';
import bcrypt from 'bcryptjs';

export { request, app, query, bcrypt };

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
