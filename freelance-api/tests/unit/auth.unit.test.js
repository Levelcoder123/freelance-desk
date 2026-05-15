// tests/unit/auth.unit.test.js
import { describe, it, expect } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const registerSchema = z.object({
    full_name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(72),
});

describe('Auth — unit', () => {
    describe('registerSchema', () => {
        it('accepts valid input', () => {
            const result = registerSchema.safeParse({
                full_name: 'Jane Doe', email: 'jane@example.com', password: 'Secret123',
            });
            expect(result.success).toBe(true);
        });

        it('rejects short password', () => {
            const result = registerSchema.safeParse({
                full_name: 'Jane', email: 'jane@example.com', password: 'short',
            });
            expect(result.success).toBe(false);
            expect(result.error.issues[0].path).toContain('password');
        });

        it('rejects invalid email', () => {
            const result = registerSchema.safeParse({
                full_name: 'Jane', email: 'not-an-email', password: 'Secret123',
            });
            expect(result.success).toBe(false);
            expect(result.error.issues[0].path).toContain('email');
        });

        it('rejects name shorter than 2 chars', () => {
            const result = registerSchema.safeParse({
                full_name: 'X', email: 'x@example.com', password: 'Secret123',
            });
            expect(result.success).toBe(false);
        });
    });

    describe('bcrypt', () => {
        it('hashes and verifies a password', async () => {
            const hash = await bcrypt.hash('MyPassword1!', 12);
            expect(await bcrypt.compare('MyPassword1!', hash)).toBe(true);
            expect(await bcrypt.compare('WrongPassword', hash)).toBe(false);
        });
    });

    describe('JWT', () => {
        it('generates and verifies an access token', () => {
            const token = jwt.sign({ sub: 'user-uuid' }, 'test-secret', { expiresIn: '15m' });
            const payload = jwt.verify(token, 'test-secret');
            expect(payload.sub).toBe('user-uuid');
        });

        it('throws on tampered token', () => {
            const token = jwt.sign({ sub: 'user-uuid' }, 'test-secret');
            expect(() => jwt.verify(token + 'x', 'test-secret')).toThrow();
        });

        it('throws on wrong secret', () => {
            const token = jwt.sign({ sub: 'user-uuid' }, 'test-secret');
            expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
        });
    });
});
